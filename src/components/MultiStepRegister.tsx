import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  User,
  MapPin,
  Store,
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MultiStepRegisterProps {
  onSuccess: () => void;
  onSwitchToSignIn: () => void;
  inviteId?: string | null;
  inviteRole?: string;
  inviteBranch?: string;
  inviteBusinessName?: string | null;
  initialPackage?: string | null;
}

const TANZANIA_REGIONS = [
  "Dar es Salaam",
  "Arusha",
  "Mwanza",
  "Dodoma",
  "Kilimanjaro (Moshi)",
  "Mbeya",
  "Morogoro",
  "Tanga",
  "Zanzibar (Mjini Magharibi)",
  "Iringa",
  "Kagera (Bukoba)",
  "Kigoma",
  "Mara (Musoma)",
  "Manyara (Babati)",
  "Mtwara",
  "Ruvuma (Songea)",
  "Shinyanga",
  "Tabora",
  "Other / Outside Tanzania",
];

const BUSINESS_TYPES = [
  { value: "retail", label: "Retail Store / Supermarket" },
  { value: "pharmacy", label: "Pharmacy & Medical Supplies" },
  { value: "hardware", label: "Hardware & Building Materials" },
  { value: "electronics", label: "Electronics & Mobile Phone Shop" },
  { value: "boutique", label: "Clothing, Shoes & Fashion Boutique" },
  { value: "restaurant", label: "Restaurant, Bar, Lounge & Cafe" },
  { value: "wholesale", label: "Wholesale & Distribution Hub" },
  { value: "beauty", label: "Beauty, Cosmetics & Salon" },
  { value: "general", label: "General Merchant / Minimarket" },
];

export function MultiStepRegister({
  onSuccess,
  onSwitchToSignIn,
  inviteId,
  inviteRole = "cashier",
  inviteBranch = "",
  inviteBusinessName,
}: MultiStepRegisterProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: User Account
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Location
  const [country] = useState("Tanzania");
  const [region, setRegion] = useState("Dar es Salaam");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");

  // Step 3: Business Information & Legal Consent
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [businessType, setBusinessType] = useState("retail");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  // Email Sent Screen State
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  const handleResendEmail = async () => {
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/setup-billing`,
        },
      });
      if (error) throw error;
      toast.success(`Activation link re-sent to ${email}! Check your inbox and spam folder.`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend activation link. Please try again.");
    } finally {
      setResendingEmail(false);
    }
  };

  // Step Validation logic
  const validateStep1 = () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!phone.trim() || phone.length < 8) {
      toast.error("Please enter a valid phone number");
      return false;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!region) {
      toast.error("Please select your region");
      return false;
    }
    if (!district.trim()) {
      toast.error("Please enter your city or district");
      return false;
    }
    if (!address.trim()) {
      toast.error("Please enter your physical business address");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!inviteId && !businessName.trim()) {
      toast.error("Please enter your business / store name");
      return false;
    }
    if (!ownerName.trim()) {
      toast.error("Please enter the business owner name");
      return false;
    }
    if (!acceptTerms || !acceptPrivacy) {
      toast.error("Please accept the Terms of Service and Privacy Policy to continue.");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      if (!ownerName) setOwnerName(fullName);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      setCurrentStep(3);
    } else if (currentStep === 3) {
      handleCompleteRegistration();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  // Final Registration: Signs up user and immediately directs them to /setup-billing
  const handleCompleteRegistration = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    try {
      const signUpMetadata: Record<string, any> = {
        full_name: fullName,
        phone: phone,
        country: country,
        region: region,
        district: district,
        address: address,
        business_type: businessType,
        owner_name: ownerName || fullName,
      };

      if (inviteId) {
        signUpMetadata.business_id = inviteId;
        signUpMetadata.role = inviteRole;
        if (inviteBranch) {
          signUpMetadata.branch_id = inviteBranch;
        }
      } else {
        signUpMetadata.business_name = businessName;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/setup-billing`,
          data: signUpMetadata,
        },
      });

      if (error) throw error;

      // Duplicate email detection
      if (data?.user && data?.user?.identities?.length === 0) {
        toast.error("This email is already registered. Please sign in with your password.");
        onSwitchToSignIn();
        return;
      }

      // Upsert user profile
      if (data?.user) {
        try {
          await supabase
            .from("profiles")
            .upsert({
              id: data.user.id,
              full_name: fullName,
              phone: phone,
              business_name: inviteId ? inviteBusinessName || businessName : businessName,
            });
        } catch (e) {
          console.warn("Profile sync notice on registration:", e);
        }
      }

      // If user session returned immediately, take them directly to setup-billing
      if (data?.session) {
        toast.success("Registration complete! Let's choose your package.");
        onSuccess();
        return;
      }

      // If email verification is enabled by Supabase
      setEmailSentSuccess(true);
      toast.success(`Activation link sent to ${email}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = (currentStep / 3) * 100;

  const STEPS_CONFIG = [
    { number: 1, label: "Akaunti / Account", icon: User },
    { number: 2, label: "Mahali / Location", icon: MapPin },
    { number: 3, label: "Biashara / Business", icon: Store },
  ];

  if (emailSentSuccess) {
    return (
      <div className="w-full max-w-lg mx-auto bg-card border border-border rounded-2xl p-6 md:p-8 shadow-[var(--shadow-elevated)] text-center space-y-6 animate-in fade-in-50 duration-300">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto ring-8 ring-primary/5">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Thibitisha Barua Pepe Yako</h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Tumetuma kiungo cha kuwezesha akaunti kwenda{" "}
            <span className="font-bold text-foreground">{email}</span>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-left text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">Hatua Zifuatazo / Next Steps:</p>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            <li>
              Fungua email yako na ubofye <strong>"Confirm Email"</strong>.
            </li>
            <li>
              Angalia pia folda ya <strong>Spam au Junk</strong> kama haijaonekana ndani ya dakika 1.
            </li>
            <li>
              Baada ya kuthibitisha, utapelekwa moja kwa moja kwenye ukurasa wa kuchagua kifurushi chako (Setup Billing).
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            type="button"
            onClick={handleResendEmail}
            disabled={resendingEmail}
            className="w-full font-semibold"
            variant="outline"
          >
            {resendingEmail ? "Sending..." : "Tuma Tena Barua Pepe"}
          </Button>
          <Button type="button" onClick={onSwitchToSignIn} className="w-full font-semibold">
            Endelea Kuingia / Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-card border border-border rounded-2xl p-5 sm:p-7 md:p-8 shadow-[var(--shadow-elevated)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-border mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            {currentStep === 1 && "Fungua Akaunti / Create Account"}
            {currentStep === 2 && "Eneo la Duka / Store Location"}
            {currentStep === 3 && "Taarifa za Biashara / Business Info"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hatua ya {currentStep} kati ya 3 — {STEPS_CONFIG.find((s) => s.number === currentStep)?.label}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
            POS Setup
          </span>
        </div>
      </div>

      {/* Step Stepper Indicator */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS_CONFIG.map((step) => {
            const IconComponent = step.icon;
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            return (
              <div key={step.number} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isCurrent
                        ? "bg-primary/20 text-primary border-2 border-primary ring-4 ring-primary/10"
                        : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <IconComponent className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold text-center truncate max-w-[100px] ${
                    isCurrent ? "text-primary font-bold" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        {/* Progress Line */}
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-5 sm:space-y-6">
        {/* STEP 1: USER ACCOUNT */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            <div>
              <Label htmlFor="fullName" className="text-xs sm:text-sm font-semibold">
                Jina Kamili / Full Name *
              </Label>
              <Input
                id="fullName"
                placeholder="mfano: Baraka Joseph"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-xs sm:text-sm font-semibold">
                  Barua Pepe / Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="mfano: baraka@duka.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-xs sm:text-sm font-semibold">
                  Namba ya Simu / WhatsApp Phone *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="mfano: 0754123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password" className="text-xs sm:text-sm font-semibold">
                  Nenosiri / Password (Angalau herufi 8) *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-semibold">
                  Thibitisha Nenosiri / Confirm Password *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs sm:text-sm font-semibold">Nchi / Country *</Label>
                <div className="mt-1.5 p-2.5 rounded-lg border border-border bg-muted/40 font-bold text-xs text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> {country}
                </div>
              </div>

              <div>
                <Label htmlFor="region" className="text-xs sm:text-sm font-semibold">
                  Mkoa / Region *
                </Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Chagua mkoa" />
                  </SelectTrigger>
                  <SelectContent>
                    {TANZANIA_REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="district" className="text-xs sm:text-sm font-semibold">
                Wilaya au Mji / District or Area *
              </Label>
              <Input
                id="district"
                placeholder="mfano: Kinondoni, Kariakoo, Ilala, Arusha Mjini"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-xs sm:text-sm font-semibold">
                Anwani ya Mtaa au Jengo / Street or Building Address *
              </Label>
              <Input
                id="address"
                placeholder="mfano: Mtaa wa Msimbazi, Ghorofa ya 1"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>
          </div>
        )}

        {/* STEP 3: BUSINESS INFORMATION & FINISH */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            {!inviteId ? (
              <div>
                <Label htmlFor="businessName" className="text-xs sm:text-sm font-semibold">
                  Jina la Biashara au Duka / Store Name *
                </Label>
                <div className="relative mt-1.5">
                  <Store className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="businessName"
                    placeholder="mfano: Mauzo General Supplies au Duka la Dawa"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Assigned Business
                </Label>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {inviteBusinessName || "Invited Store"}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ownerName" className="text-xs sm:text-sm font-semibold">
                  Jina la Mmiliki / Owner Name *
                </Label>
                <Input
                  id="ownerName"
                  placeholder="mfano: Baraka Joseph"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="businessType" className="text-xs sm:text-sm font-semibold">
                  Aina ya Biashara / Business Category *
                </Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Chagua aina ya biashara" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((bt) => (
                      <SelectItem key={bt.value} value={bt.value}>
                        {bt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Terms of Service & Privacy Policy Acceptance */}
            <div className="space-y-2.5 pt-3 border-t border-border/70 mt-3">
              <div className="flex items-start space-x-2.5">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="terms"
                  className="text-xs leading-relaxed text-muted-foreground font-normal cursor-pointer"
                >
                  Nimesoma na ninakubali{" "}
                  <Link to="/terms" target="_blank" className="text-primary font-bold underline">
                    MauzoChap Terms of Service
                  </Link>{" "}
                  ikiwemo vigezo vya uendeshaji, majanga na ukomo wa dhima (disaster & downtime defense).
                </Label>
              </div>

              <div className="flex items-start space-x-2.5">
                <Checkbox
                  id="privacy"
                  checked={acceptPrivacy}
                  onCheckedChange={(checked) => setAcceptPrivacy(!!checked)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="privacy"
                  className="text-xs leading-relaxed text-muted-foreground font-normal cursor-pointer"
                >
                  Ninakubali{" "}
                  <Link to="/privacy" target="_blank" className="text-primary font-bold underline">
                    Sera ya Faragha (Privacy Policy)
                  </Link>{" "}
                  kuhusu usalama na ulinzi wa data za duka langu.
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border mt-6 gap-3">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              className="flex items-center gap-1.5 text-xs font-semibold"
              disabled={loading}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Nyuma
            </Button>
          ) : (
            <button
              type="button"
              onClick={onSwitchToSignIn}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Una akaunti tayari? Ingia
            </button>
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-1.5 ml-auto text-xs font-bold"
            >
              Endelea <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleCompleteRegistration}
              disabled={loading || !acceptTerms || !acceptPrivacy}
              className="flex items-center gap-2 ml-auto bg-primary text-primary-foreground font-bold shadow-md hover:opacity-90 text-xs py-2.5 px-5 cursor-pointer"
            >
              {loading ? "Inasajili Duka..." : "Kamilisha & Chagua Kifurushi"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
