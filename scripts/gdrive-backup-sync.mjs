#!/usr/bin/env node
/**
 * MauzoChap Automated Encrypted Backup -> Google Drive Uploader & Verifier
 *
 * Security & Safety Guarantees:
 * - Zero third-party dependencies (Node.js 20+ built-in modules & fetch only).
 * - Reads credentials strictly from environment variables (GitHub Actions Secrets).
 * - Never logs secrets, OAuth tokens, passphrases, or database URLs.
 * - Strictly confines all folder creation, uploads, and 30-day retention to direct
 *   children of GDRIVE_FOLDER_ID matching `^MauzoChap_Backup_YYYY-MM-DD$`.
 * - Verifies remote MD5 checksum, file size, parent folder, and non-trashed status
 *   on Google Drive before considering the backup successful.
 * - Runs 30-day retention ONLY after today's upload & remote verification succeed,
 *   with a minimum-retained-backups safety floor (default: 7).
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const TOKEN_URL = "https://oauth2.googleapis.com/token";
export const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
export const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";

export const BACKUP_FOLDER_PATTERN = /^MauzoChap_Backup_(\d{4}-\d{2}-\d{2})$/;
export const CHUNK_SIZE_BYTES = 8 * 1024 * 1024; // 8 MiB (multiple of 256 KiB required by Google Drive)
export const DEFAULT_RETENTION_DAYS = 30;
export const MIN_RETAINED_BACKUPS = 7;
export const HTTP_TIMEOUT_MS = 120_000;
export const MAX_RETRIES = 4;

export class BackupSyncError extends Error {
  constructor(message) {
    super(message);
    this.name = "BackupSyncError";
  }
}

function log(message) {
  const nowUtc = new Date().toISOString();
  console.log(`[${nowUtc}] ${message}`);
}

function requireEnv(name) {
  const value = (process.env[name] || "").trim();
  if (!value) {
    throw new BackupSyncError(`Missing required environment variable: ${name}`);
  }
  return value;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate YYYY-MM-DD strictly (rejecting impossible calendar dates like 2026-02-31).
 * Returns UTC midnight epoch ms for date arithmetic, or null if invalid.
 */
export function parseStrictIsoDate(dateStr) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null;
  }
  return utcDate.getTime();
}

export const DEFAULT_SUPABASE_PROJECT_REF = "rcinghijelhlehfycjka";
export const DEFAULT_SUPABASE_POOLER_HOST = "aws-1-eu-central-1.pooler.supabase.com:5432";

/**
 * Safely normalize a Supabase PostgreSQL connection URI (or raw password) so that:
 * 1. If a raw password was pasted into SUPABASE_DB_URL, it is wrapped into the full
 *    IPv4 Session Pooler URI for project rcinghijelhlehfycjka.
 * 2. If a Direct Connection URI (db.<ref>.supabase.co) or a pooler URI missing the
 *    tenant suffix (`postgres` or `postgres.PROJECT_REF`, which causes Supavisor
 *    `ENOIDENTIFIER: no tenant identifier provided`) was pasted, it automatically
 *    rewrites the user to `postgres.rcinghijelhlehfycjka` and host to the IPv4 Session Pooler.
 * 3. Outer template brackets `[...]` and quotes are stripped, and special password
 *    characters (@, #, !, ?, /, %) are URL-encoded without double-encoding.
 */
export function normalizePostgresUri(
  rawUri,
  projectRef = DEFAULT_SUPABASE_PROJECT_REF,
  poolerHost = DEFAULT_SUPABASE_POOLER_HOST
) {
  let trimmed = String(rawUri || "").trim();
  if (!trimmed) return "";

  // Strip accidental leading KEY= prefix or surrounding quotes
  trimmed = trimmed.replace(/^SUPABASE_DB_URL\s*=\s*/i, "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  const decodeAndCleanPassword = (rawPass) => {
    let pass = String(rawPass || "").trim();
    if (pass.length > 2 && pass.startsWith("[") && pass.endsWith("]")) {
      pass = pass.slice(1, -1);
    }
    try {
      const candidate = decodeURIComponent(pass);
      if (encodeURIComponent(candidate) === pass) {
        pass = candidate;
      }
    } catch {
      // Contains raw '%'; keep as-is so encodeURIComponent encodes it cleanly
    }
    if (pass.length > 2 && pass.startsWith("[") && pass.endsWith("]")) {
      pass = pass.slice(1, -1);
    }
    return encodeURIComponent(pass);
  };

  const schemeMatch = /^(postgres(?:ql)?:\/\/)(.+)$/i.exec(trimmed);
  if (!schemeMatch) {
    // Raw password was provided instead of a full URI -> construct full Session Pooler URI
    const encodedPass = decodeAndCleanPassword(trimmed);
    return `postgresql://postgres.${projectRef}:${encodedPass}@${poolerHost}/postgres?sslmode=require`;
  }

  const rest = schemeMatch[2];
  const lastAt = rest.lastIndexOf("@");
  if (lastAt === -1) return trimmed;

  const userInfo = rest.slice(0, lastAt);
  const hostAndPathAndQuery = rest.slice(lastAt + 1);
  const colonIdx = userInfo.indexOf(":");
  if (colonIdx === -1) return trimmed;

  let user = userInfo.slice(0, colonIdx).trim();
  const rawPass = userInfo.slice(colonIdx + 1);
  const encodedPass = decodeAndCleanPassword(rawPass);

  // Separate host:port from /dbname?query
  const slashIdx = hostAndPathAndQuery.indexOf("/");
  let hostPort = slashIdx === -1 ? hostAndPathAndQuery : hostAndPathAndQuery.slice(0, slashIdx);
  const pathAndQuery = slashIdx === -1 ? "/postgres" : hostAndPathAndQuery.slice(slashIdx);

  // If Direct IPv6 host (db.<ref>.supabase.co) or transaction pooler (:6543) was pasted, route via IPv4 Session Pooler (:5432)
  if (/^db\.[a-z0-9]+\.supabase\.co(?::\d+)?$/i.test(hostPort)) {
    hostPort = poolerHost;
  } else if (/\.pooler\.supabase\.com:6543$/i.test(hostPort)) {
    hostPort = hostPort.replace(/:6543$/, ":5432");
  }

  // Ensure tenant identifier (.rcinghijelhlehfycjka) is always present on pooler connections to prevent ENOIDENTIFIER
  if (
    /\.pooler\.supabase\.com/i.test(hostPort) &&
    (user === "postgres" || /^postgres\.PROJECT_REF$/i.test(user) || !user.includes("."))
  ) {
    user = `${user.split(".")[0]}.${projectRef}`;
  }

  const normalized = `postgresql://${user}:${encodedPass}@${hostPort}${pathAndQuery}`;
  if (!/[?&]sslmode=/i.test(normalized)) {
    return `${normalized}${normalized.includes("?") ? "&" : "?"}sslmode=require`;
  }
  return normalized;
}

export async function computeHashes(filePath) {
  return new Promise((resolve, reject) => {
    const md5 = crypto.createHash("md5");
    const sha256 = crypto.createHash("sha256");
    let sizeBytes = 0;

    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => {
      sizeBytes += chunk.length;
      md5.update(chunk);
      sha256.update(chunk);
    });
    stream.on("end", () => {
      resolve({
        sizeBytes,
        md5Hex: md5.digest("hex"),
        sha256Hex: sha256.digest("hex"),
      });
    });
    stream.on("error", (err) => reject(err));
  });
}

async function fetchWithRetry(url, init, expectedStatuses = [200], fetchImpl = globalThis.fetch) {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
    try {
      const resp = await fetchImpl(url, { ...init, signal: controller.signal });
      clearTimeout(timer);

      if (expectedStatuses.includes(resp.status)) {
        return resp;
      }

      const rawErr = (await resp.text()).slice(0, 400);
      if ([429, 500, 502, 503, 504].includes(resp.status) && attempt < MAX_RETRIES) {
        const waitMs = 2 ** attempt * 1000;
        log(`Transient HTTP ${resp.status}; retrying in ${waitMs / 1000}s (attempt ${attempt}/${MAX_RETRIES})...`);
        await sleep(waitMs);
        lastError = new Error(`HTTP ${resp.status}`);
        continue;
      }

      throw new BackupSyncError(
        `Google API HTTP ${resp.status} on ${init.method || "GET"} ${url.split("?")[0]}: ${rawErr}`
      );
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof BackupSyncError) {
        throw err;
      }
      if (attempt < MAX_RETRIES) {
        const waitMs = 2 ** attempt * 1000;
        log(`Network error (${err?.message || err}); retrying in ${waitMs / 1000}s (attempt ${attempt}/${MAX_RETRIES})...`);
        await sleep(waitMs);
        lastError = err;
        continue;
      }
      throw new BackupSyncError(`Network error calling Google API: ${err?.message || err}`);
    }
  }
  throw new BackupSyncError(`Request failed after ${MAX_RETRIES} attempts: ${lastError?.message || lastError}`);
}

export async function exchangeRefreshToken(clientId, clientSecret, refreshToken, fetchImpl = globalThis.fetch) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  }).toString();

  const resp = await fetchWithRetry(
    TOKEN_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
    [200],
    fetchImpl
  );

  const data = await resp.json();
  if (!data?.access_token) {
    throw new BackupSyncError(
      "OAuth token exchange succeeded without an access_token. " +
        "Verify GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, and GDRIVE_REFRESH_TOKEN."
    );
  }
  return String(data.access_token);
}

export class GoogleDriveClient {
  constructor(accessToken, fetchImpl = globalThis.fetch) {
    this._accessToken = accessToken;
    this._fetch = fetchImpl;
  }

  _authHeaders(extra = {}) {
    return {
      Authorization: `Bearer ${this._accessToken}`,
      ...extra,
    };
  }

  async getFileMetadata(fileId, fields) {
    const params = new URLSearchParams({ fields, supportsAllDrives: "false" });
    const url = `${DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}?${params.toString()}`;
    const resp = await fetchWithRetry(
      url,
      { method: "GET", headers: this._authHeaders() },
      [200],
      this._fetch
    );
    return resp.json();
  }

  async verifyRootBackupFolder(rootFolderId) {
    const meta = await this.getFileMetadata(rootFolderId, "id,name,mimeType,trashed");
    if (meta.trashed) {
      throw new BackupSyncError(
        `Destination folder '${meta.name}' (${rootFolderId}) is in Google Drive Trash.`
      );
    }
    if (meta.mimeType !== "application/vnd.google-apps.folder") {
      throw new BackupSyncError(
        `GDRIVE_FOLDER_ID (${rootFolderId}) is not a Google Drive folder.`
      );
    }
    return meta;
  }

  async listDirectChildFolders(parentFolderId) {
    const escapedParent = parentFolderId.replace(/'/g, "\\'");
    const query =
      `'${escapedParent}' in parents ` +
      "and mimeType = 'application/vnd.google-apps.folder' " +
      "and trashed = false";

    const folders = [];
    let pageToken = null;
    while (true) {
      const params = new URLSearchParams({
        q: query,
        fields: "nextPageToken,files(id,name,createdTime,parents,trashed)",
        pageSize: "200",
        supportsAllDrives: "false",
      });
      if (pageToken) params.set("pageToken", pageToken);

      const url = `${DRIVE_API_BASE}/files?${params.toString()}`;
      const resp = await fetchWithRetry(
        url,
        { method: "GET", headers: this._authHeaders() },
        [200],
        this._fetch
      );
      const data = await resp.json();
      if (Array.isArray(data.files)) {
        folders.push(...data.files);
      }
      pageToken = data.nextPageToken || null;
      if (!pageToken) break;
    }
    return folders;
  }

  async getOrCreateDateFolder(rootFolderId, folderName) {
    if (!BACKUP_FOLDER_PATTERN.test(folderName)) {
      throw new BackupSyncError(`Refusing to create backup folder with unexpected name: ${folderName}`);
    }

    const children = await this.listDirectChildFolders(rootFolderId);
    for (const folder of children) {
      if (folder.name === folderName && !folder.trashed) {
        log(`Reusing existing daily backup folder: ${folderName} (id=${folder.id})`);
        return String(folder.id);
      }
    }

    const params = new URLSearchParams({ fields: "id,name,parents" });
    const url = `${DRIVE_API_BASE}/files?${params.toString()}`;
    const resp = await fetchWithRetry(
      url,
      {
        method: "POST",
        headers: this._authHeaders({ "Content-Type": "application/json; charset=UTF-8" }),
        body: JSON.stringify({
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
          parents: [rootFolderId],
        }),
      },
      [200],
      this._fetch
    );

    const created = await resp.json();
    log(`Created daily backup folder: ${folderName} (id=${created.id})`);
    return String(created.id);
  }

  async uploadFileResumable(localPath, parentFolderId, mimeType) {
    const stat = fs.statSync(localPath);
    const fileSize = stat.size;
    if (fileSize <= 0) {
      throw new BackupSyncError(`Refusing to upload empty file: ${path.basename(localPath)}`);
    }

    const initParams = new URLSearchParams({
      uploadType: "resumable",
      fields: "id,name,size,md5Checksum,parents,trashed",
    });
    const initUrl = `${DRIVE_UPLOAD_BASE}/files?${initParams.toString()}`;
    const initResp = await fetchWithRetry(
      initUrl,
      {
        method: "POST",
        headers: this._authHeaders({
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": mimeType,
          "X-Upload-Content-Length": String(fileSize),
        }),
        body: JSON.stringify({
          name: path.basename(localPath),
          parents: [parentFolderId],
        }),
      },
      [200],
      this._fetch
    );

    const uploadUrl = initResp.headers.get("location");
    if (!uploadUrl) {
      throw new BackupSyncError(
        `Google Drive did not return resumable upload Location for ${path.basename(localPath)}`
      );
    }

    const fd = fs.openSync(localPath, "r");
    try {
      let offset = 0;
      while (offset < fileSize) {
        const remaining = fileSize - offset;
        const toRead = Math.min(CHUNK_SIZE_BYTES, remaining);
        const buf = Buffer.allocUnsafe(toRead);
        const bytesRead = fs.readSync(fd, buf, 0, toRead, offset);
        if (bytesRead <= 0) break;

        const chunk = bytesRead === toRead ? buf : buf.subarray(0, bytesRead);
        const endByte = offset + bytesRead - 1;
        const contentRange = `bytes ${offset}-${endByte}/${fileSize}`;

        const resp = await fetchWithRetry(
          uploadUrl,
          {
            method: "PUT",
            headers: {
              "Content-Type": mimeType,
              "Content-Length": String(chunk.length),
              "Content-Range": contentRange,
            },
            body: chunk,
          },
          [200, 201, 308],
          this._fetch
        );

        offset += bytesRead;
        if (resp.status === 200 || resp.status === 201) {
          return resp.json();
        }
      }
    } finally {
      fs.closeSync(fd);
    }

    throw new BackupSyncError(
      `Resumable upload ended without completion metadata for ${path.basename(localPath)}`
    );
  }

  async verifyRemoteFile(fileId, expectedParentId, expectedName, expectedSize, expectedMd5) {
    const remote = await this.getFileMetadata(fileId, "id,name,size,md5Checksum,parents,trashed");
    if (remote.trashed) {
      throw new BackupSyncError(`Verification failed: uploaded file ${expectedName} is trashed`);
    }
    if (remote.name !== expectedName) {
      throw new BackupSyncError(
        `Verification failed: expected name '${expectedName}', got '${remote.name}'`
      );
    }
    const remoteParents = Array.isArray(remote.parents) ? remote.parents : [];
    if (!remoteParents.includes(expectedParentId)) {
      throw new BackupSyncError(
        `Verification failed: file '${expectedName}' is not in expected parent folder`
      );
    }
    const remoteSize = Number(remote.size ?? -1);
    if (remoteSize !== expectedSize) {
      throw new BackupSyncError(
        `Verification failed for '${expectedName}': size mismatch (local=${expectedSize}, remote=${remoteSize})`
      );
    }
    const remoteMd5 = String(remote.md5Checksum || "").toLowerCase();
    if (!remoteMd5 || remoteMd5 !== expectedMd5.toLowerCase()) {
      throw new BackupSyncError(
        `Verification failed for '${expectedName}': MD5 mismatch (local=${expectedMd5.toLowerCase()}, remote=${remoteMd5})`
      );
    }
    return remote;
  }

  async trashFolder(folderId) {
    const url = `${DRIVE_API_BASE}/files/${encodeURIComponent(folderId)}?fields=id,trashed`;
    const resp = await fetchWithRetry(
      url,
      {
        method: "PATCH",
        headers: this._authHeaders({ "Content-Type": "application/json; charset=UTF-8" }),
        body: JSON.stringify({ trashed: true }),
      },
      [200],
      this._fetch
    );
    const result = await resp.json();
    if (!result.trashed) {
      throw new BackupSyncError(`Failed to move expired backup folder ${folderId} to trash`);
    }
  }
}

/**
 * Pure retention selection logic (unit-testable).
 *
 * - Considers ONLY folders strictly matching `^MauzoChap_Backup_YYYY-MM-DD$` with valid calendar dates.
 * - Never selects today's or future-dated folders.
 * - Selects only folders strictly older than `todayEat - retentionDays`.
 * - Enforces safety floor: keeps at least `minRetained` newest valid backup folders.
 */
export function selectExpiredBackupFolders(
  folders,
  todayEatStr,
  retentionDays = DEFAULT_RETENTION_DAYS,
  minRetained = MIN_RETAINED_BACKUPS
) {
  const todayMs = parseStrictIsoDate(todayEatStr);
  if (todayMs === null) {
    throw new BackupSyncError(`Invalid backup date '${todayEatStr}': expected YYYY-MM-DD`);
  }

  const valid = [];
  for (const folder of folders) {
    const name = String(folder?.name || "");
    const match = BACKUP_FOLDER_PATTERN.exec(name);
    if (!match) continue;
    const folderMs = parseStrictIsoDate(match[1]);
    if (folderMs === null) continue;
    valid.push({ folderMs, folder });
  }

  // Sort newest first
  valid.sort((a, b) => b.folderMs - a.folderMs);

  const dayMs = 24 * 60 * 60 * 1000;
  const cutoffMs = todayMs - retentionDays * dayMs;

  if (valid.length <= minRetained) {
    return {
      toRemove: [],
      validFolders: valid.map((v) => v.folder),
    };
  }

  const protectedIds = new Set(valid.slice(0, minRetained).map((v) => String(v.folder.id)));
  const toRemove = [];
  for (const { folderMs, folder } of valid) {
    if (protectedIds.has(String(folder.id))) continue;
    if (folderMs >= todayMs) continue;
    if (folderMs < cutoffMs) {
      toRemove.push(folder);
    }
  }

  return {
    toRemove,
    validFolders: valid.map((v) => v.folder),
  };
}

function parseCliArgs(argv) {
  const args = {
    backupDate: "",
    backupFile: "",
    checksumFile: "",
    manifestFile: "",
    retentionDays: 0,
    skipRetention: true,
    resultJson: "",
  };

  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--skip-retention") {
      args.skipRetention = true;
    } else if (flag === "--enable-retention") {
      args.skipRetention = false;
    } else if (flag === "--backup-date") {
      args.backupDate = argv[++i] || "";
    } else if (flag === "--backup-file" || flag === "--encrypted-file") {
      args.backupFile = argv[++i] || "";
    } else if (flag === "--checksum-file") {
      args.checksumFile = argv[++i] || "";
    } else if (flag === "--manifest-file") {
      args.manifestFile = argv[++i] || "";
    } else if (flag === "--retention-days") {
      args.retentionDays = Number(argv[++i]);
    } else if (flag === "--result-json") {
      args.resultJson = argv[++i] || "";
    } else {
      throw new BackupSyncError(`Unknown CLI argument: ${flag}`);
    }
  }

  if (!args.backupDate || parseStrictIsoDate(args.backupDate) === null) {
    throw new BackupSyncError(`Invalid or missing --backup-date '${args.backupDate}': expected YYYY-MM-DD`);
  }
  if (!Number.isInteger(args.retentionDays) || args.retentionDays < 0) {
    throw new BackupSyncError(`Invalid --retention-days '${args.retentionDays}'`);
  }
  for (const [label, filePath] of [
    ["--backup-file", args.backupFile],
    ["--checksum-file", args.checksumFile],
    ["--manifest-file", args.manifestFile],
  ]) {
    if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).size <= 0) {
      throw new BackupSyncError(`Required backup artifact missing or empty for ${label}: ${filePath}`);
    }
  }

  return args;
}

export async function main(argv) {
  const args = parseCliArgs(argv);
  const folderName = `MauzoChap_Backup_${args.backupDate}`;

  const clientId = requireEnv("GDRIVE_CLIENT_ID");
  const clientSecret = requireEnv("GDRIVE_CLIENT_SECRET");
  const refreshToken = requireEnv("GDRIVE_REFRESH_TOKEN");
  const rootFolderId = requireEnv("GDRIVE_FOLDER_ID");

  log("Exchanging OAuth 2.0 refresh token for short-lived Google Drive access token...");
  const accessToken = await exchangeRefreshToken(clientId, clientSecret, refreshToken);
  const drive = new GoogleDriveClient(accessToken);

  const rootMeta = await drive.verifyRootBackupFolder(rootFolderId);
  log(`Verified root backup folder: '${rootMeta.name}' (id=${rootFolderId})`);

  const dateFolderId = await drive.getOrCreateDateFolder(rootFolderId, folderName);

  const backupMimeType = args.backupFile.endsWith(".gpg")
    ? "application/pgp-encrypted"
    : "application/octet-stream";

  const artifacts = [
    { filePath: args.backupFile, mimeType: backupMimeType },
    { filePath: args.checksumFile, mimeType: "text/plain" },
    { filePath: args.manifestFile, mimeType: "application/json" },
  ];

  const verifiedUploads = [];
  for (const { filePath, mimeType } of artifacts) {
    const fileName = path.basename(filePath);
    const { sizeBytes, md5Hex, sha256Hex } = await computeHashes(filePath);
    log(`Uploading ${fileName} (${sizeBytes} bytes)...`);

    const uploaded = await drive.uploadFileResumable(filePath, dateFolderId, mimeType);
    const remote = await drive.verifyRemoteFile(
      String(uploaded.id),
      dateFolderId,
      fileName,
      sizeBytes,
      md5Hex
    );

    log(
      `Verified on Google Drive: ${remote.name} (id=${remote.id}, size=${remote.size}, md5=${remote.md5Checksum})`
    );
    verifiedUploads.push({
      name: remote.name,
      drive_file_id: remote.id,
      size_bytes: sizeBytes,
      md5: md5Hex,
      sha256: sha256Hex,
      verified: true,
    });
  }

  // Retention runs ONLY after every artifact above has been uploaded AND verified!
  const trashedFolders = [];
  let totalValidFolders = 0;

  if (args.skipRetention) {
    log("Retention cleanup skipped (--skip-retention requested).");
  } else {
    log(
      `Evaluating safe ${args.retentionDays}-day retention strictly inside '${rootMeta.name}' ` +
        `(safety floor: keep >= ${MIN_RETAINED_BACKUPS} backups)...`
    );
    const allChildren = await drive.listDirectChildFolders(rootFolderId);
    const { toRemove, validFolders } = selectExpiredBackupFolders(
      allChildren,
      args.backupDate,
      args.retentionDays,
      MIN_RETAINED_BACKUPS
    );
    totalValidFolders = validFolders.length;

    if (toRemove.length === 0) {
      log(`No expired backup folders to prune (valid backup folders found: ${totalValidFolders}).`);
    } else {
      for (const expired of toRemove) {
        log(`Moving expired backup folder to Trash: ${expired.name} (id=${expired.id})`);
        await drive.trashFolder(String(expired.id));
        trashedFolders.push(String(expired.name));
      }
    }
  }

  const summary = {
    status: "verified",
    backup_date_eat: args.backupDate,
    root_folder_name: rootMeta.name,
    date_folder_name: folderName,
    date_folder_id: dateFolderId,
    uploaded_files: verifiedUploads,
    retention_days: args.retentionDays,
    retention_skipped: args.skipRetention,
    valid_backup_folders_seen: totalValidFolders,
    trashed_expired_folders: trashedFolders,
  };

  if (args.resultJson) {
    fs.writeFileSync(args.resultJson, JSON.stringify(summary, null, 2), "utf8");
  }

  log(`Backup upload & verification completed successfully for ${folderName}.`);
  return 0;
}

const isDirectEntry =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectEntry) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err) => {
      log(`ERROR: ${err?.message || err}`);
      process.exit(1);
    });
}

