import { describe, it, expect, vi } from "vitest";
import { sendOtpSMS } from "@/lib/sms-service";

describe("OTP Password Reset Service", () => {
  it("formats the SMS OTP message with MauzoChap branding and 10-minute expiry", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message_id: "sms-otp-999" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await sendOtpSMS({
      phone: "0712345678",
      code: "839201",
    });

    expect(fetchMock).toHaveBeenCalled();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("https://api.swalasms.com/v1/sms/messages");
    
    const body = JSON.parse(options.body);
    expect(body.recipient).toBe("+255712345678");
    expect(body.body).toContain("839201");
    expect(body.body).toContain("MauzoChap");
    expect(body.body).toContain("dakika 10");
    expect(body.sender_id).toBe("MauzoChap");
    expect(res.success).toBe(true);

    vi.unstubAllGlobals();
  });

  it("validates 6-digit OTP formatting", () => {
    const sanitizeOtp = (input: string) => input.replace(/\D/g, "").slice(0, 6);

    expect(sanitizeOtp("123456")).toBe("123456");
    expect(sanitizeOtp("12 34 56")).toBe("123456");
    expect(sanitizeOtp("abc123def456")).toBe("123456");
    expect(sanitizeOtp("123456789")).toBe("123456");
    expect(sanitizeOtp("123")).toHaveLength(3);
    expect(sanitizeOtp("998877")).toHaveLength(6);
  });

  it("validates password length and confirmation matches", () => {
    const validateReset = (otp: string, pass: string, confirm: string) => {
      if (otp.length !== 6) return "OTP must be 6 digits";
      if (pass.length < 8) return "Password must be at least 8 characters";
      if (pass !== confirm) return "Passwords do not match";
      return "valid";
    };

    expect(validateReset("12345", "newPass123", "newPass123")).toBe("OTP must be 6 digits");
    expect(validateReset("123456", "short", "short")).toBe("Password must be at least 8 characters");
    expect(validateReset("123456", "password123", "different123")).toBe("Passwords do not match");
    expect(validateReset("123456", "newPassword@2026", "newPassword@2026")).toBe("valid");
  });
});
