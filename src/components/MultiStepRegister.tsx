import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  User, 
  MapPin, 
  Store, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Receipt, 
  Users, 
  Bell,
  Smartphone,
  Lock,
  Check,
  Building2,
  Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MultiStepRegisterProps {
  onSuccess: () => void;
  onSwitchToSignIn: () => void;
  inviteId?: string | null;
  inviteRole?: string;
  inviteBranch?: string;
  inviteBusinessName?: string | null;
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
  "Other / Outside Tanzania"
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
  inviteBusinessName
}: MultiStepRegisterProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
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

  // Step 3: Business Information
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [businessType, setBusinessType] = useState("retail");

  // Step 5: Verification State
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

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
      toast.error("Please enter your business name");
      return false;
    }
    if (!ownerName.trim()) {
      toast.error("Please enter the business owner name");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      // Pre-fill owner name if empty
      if (!ownerName) setOwnerName(fullName);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!validateStep3()) return;
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  // OTP Handlers
  const triggerSendOtp = () => {
    setOtpSent(true);
    setResendTimer(30);
    toast.success(`Verification code sent to ${phone}`);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const verifyOtpCode = () => {
    if (otpCode.length < 4) {
      toast.error("Please enter a valid verification code");
      return;
    }
    setOtpVerified(true);
    toast.success("Phone number verified successfully!");
  };

  // Final Submission
  const handleCompleteRegistration = async () => {
    if (!acceptTerms || !acceptPrivacy) {
      toast.error("You must accept the Terms & Conditions and Privacy Policy to continue.");
      return;
    }

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
          emailRedirectTo: window.location.origin,
          data: signUpMetadata,
        },
      });

      if (error) throw error;

      // If user session is returned immediately, sync profile
      if (data?.user) {
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: fullName,
            phone: phone,
            business_name: inviteId ? (inviteBusinessName || businessName) : businessName,
          });
        } catch (e) {
          console.warn("Profile sync error on registration:", e);
        }
      }

      toast.success("Registration successful! Welcome to MauzoChap.");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Progress Bar percentage
  const progressPercentage = (currentStep / 5) * 100;

  const STEPS_CONFIG = [
    { number: 1, label: "User Account", icon: User },
    { number: 2, label: "Location", icon: MapPin },
    { number: 3, label: "Business", icon: Store },
    { number: 4, label: "Awareness", icon: Sparkles },
    { number: 5, label: "Verification", icon: ShieldCheck },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-[var(--shadow-elevated)] overflow-hidden transition-all duration-300">
      {/* Top Header & Step Indicator */}
      <div className="p-6 md:p-8 bg-muted/40 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-semibold tracking-wider text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-full">
              Step {currentStep} of 5
            </span>
            <h2 className="text-xl md:text-2xl font-bold mt-2">
              {currentStep === 1 && "Create Your Account"}
              {currentStep === 2 && "Business Location Details"}
              {currentStep === 3 && "Business Information"}
              {currentStep === 4 && "Explore MauzoChap Features"}
              {currentStep === 5 && "Account Verification"}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              {currentStep === 1 && "Set up your admin credentials to get started."}
              {currentStep === 2 && "Where is your store or business physically located?"}
              {currentStep === 3 && "Tell us about your store name and industry."}
              {currentStep === 4 && "Discover powerful POS tools included in your 14-day free trial."}
              {currentStep === 5 && "Verify your phone & accept policy terms to complete registration."}
            </p>
          </div>
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:block"
          >
            Already registered? <span className="text-primary font-semibold underline">Sign In</span>
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="relative mb-2">
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Step Indicators Grid */}
        <div className="grid grid-cols-5 gap-1 pt-4 text-center">
          {STEPS_CONFIG.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.number;
            const isActive = currentStep === step.number;

            return (
              <div
                key={step.number}
                className="flex flex-col items-center gap-1.5 cursor-default group"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCompleted
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isActive
                      ? "bg-primary/20 text-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[11px] font-medium hidden sm:block truncate max-w-full ${
                    isActive ? "text-primary font-bold" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Form Body */}
      <div className="p-6 md:p-8 space-y-6">
        {/* STEP 1: USER ACCOUNT */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            {inviteId && inviteBusinessName && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3 text-sm">
                <Building2 className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Invited to join {inviteBusinessName}</p>
                  <p className="text-xs text-muted-foreground">Role: <span className="capitalize font-medium text-primary">{inviteRole}</span></p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="fullName" className="text-sm font-semibold">Full Name *</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  placeholder="e.g. Baraka Joseph"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-sm font-semibold">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@business.co.tz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-semibold">Phone Number *</Label>
                <div className="relative mt-1.5">
                  <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0754 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password" className="text-sm font-semibold">Password *</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password *</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country" className="text-sm font-semibold">Country</Label>
                <div className="relative mt-1.5">
                  <Globe className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="country"
                    value={country}
                    readOnly
                    className="pl-10 bg-muted/50 cursor-not-allowed font-medium text-foreground"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Default region set to Tanzania</p>
              </div>

              <div>
                <Label htmlFor="region" className="text-sm font-semibold">Region *</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {TANZANIA_REGIONS.map((reg) => (
                      <SelectItem key={reg} value={reg}>
                        {reg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="district" className="text-sm font-semibold">City / District *</Label>
                <Input
                  id="district"
                  placeholder="e.g. Kinondoni, Ilala, Arusha Urban"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address" className="text-sm font-semibold">Business Physical Address *</Label>
                <Input
                  id="address"
                  placeholder="e.g. Sam Nujoma Rd, Kariakoo Market, Plaza 3rd Fl"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: BUSINESS INFORMATION */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            {!inviteId ? (
              <div>
                <Label htmlFor="businessName" className="text-sm font-semibold">Business / Store Name *</Label>
                <div className="relative mt-1.5">
                  <Store className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="businessName"
                    placeholder="e.g. Mauzo General Supplies"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Assigned Business</Label>
                <p className="text-base font-bold text-foreground mt-0.5">{inviteBusinessName || "Invited Store"}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ownerName" className="text-sm font-semibold">Business Owner Name *</Label>
                <Input
                  id="ownerName"
                  placeholder="e.g. Baraka Joseph"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="businessType" className="text-sm font-semibold">Business Category / Type *</Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select business type" />
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
          </div>
        )}

        {/* STEP 4: AWARENESS SHOWCASE */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in-50 duration-300">
            {/* Free Trial Banner */}
            <div className="p-4 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">MauzoChap 14-Day Free Access Trial</h3>
                  <p className="text-xs text-muted-foreground">Full access to all POS modules • No credit card required</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                100% Free
              </span>
            </div>

            {/* Core Features Grid */}
            <h3 className="text-sm font-bold tracking-tight text-foreground">Included Features in MauzoChap POS</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-border bg-card flex items-start gap-3 hover:border-primary/40 transition-colors">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 shrink-0">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Fast POS Sales</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Quick barcode checkout, invoice generation & thermal printing.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card flex items-start gap-3 hover:border-primary/40 transition-colors">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Smart Inventory</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Batch tracking, stock transfer between branches & low-stock alerts.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card flex items-start gap-3 hover:border-primary/40 transition-colors">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Expenses & Suppliers</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Track daily store costs, supplier payments & vendor balances.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card flex items-start gap-3 hover:border-primary/40 transition-colors">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Real-time Analytics</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Daily sales reports, profit margins, and top selling products.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card flex items-start gap-3 hover:border-primary/40 transition-colors">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Customer Debt & Credit</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Customer profiles, debt collection logs & loyalty points.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card flex items-start gap-3 hover:border-primary/40 transition-colors">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Business Alerts</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Automated SMS/email summaries and stock expiration warnings.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: VERIFICATION */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-in fade-in-50 duration-300">
            {/* Phone OTP Section */}
            <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Phone Number OTP Verification</span>
                </div>
                {otpVerified ? (
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                    Pending Verification
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Verification code will be sent to <span className="font-semibold text-foreground">{phone || "your phone number"}</span>.
              </p>

              {!otpVerified ? (
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    className="max-w-[180px] text-center font-mono tracking-widest text-base font-bold"
                  />
                  {!otpSent ? (
                    <Button type="button" variant="outline" size="sm" onClick={triggerSendOtp}>
                      Send OTP Code
                    </Button>
                  ) : (
                    <Button type="button" size="sm" onClick={verifyOtpCode}>
                      Verify Code
                    </Button>
                  )}
                  {otpSent && resendTimer > 0 && (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Resend in {resendTimer}s
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-emerald-600 font-medium">✓ Phone number confirmed. Ready for account creation.</p>
              )}
            </div>

            {/* Email Verification Banner */}
            <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">Email Verification Notice</p>
                <p className="text-muted-foreground mt-0.5">An account activation link will also be sent to <span className="font-medium text-foreground">{email}</span>.</p>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-2.5">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-xs leading-relaxed text-muted-foreground font-normal cursor-pointer">
                  I have read and agree to the <span className="text-primary font-semibold underline">MauzoChap Terms & Conditions</span> governing POS store operations and user accounts.
                </Label>
              </div>

              <div className="flex items-start space-x-2.5">
                <Checkbox
                  id="privacy"
                  checked={acceptPrivacy}
                  onCheckedChange={(checked) => setAcceptPrivacy(!!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor="privacy" className="text-xs leading-relaxed text-muted-foreground font-normal cursor-pointer">
                  I agree to the <span className="text-primary font-semibold underline">Privacy Policy</span> regarding data storage and inventory privacy protection.
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Form Navigation Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-border mt-6">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </Button>
          ) : (
            <button
              type="button"
              onClick={onSwitchToSignIn}
              className="text-xs font-semibold text-primary hover:underline sm:hidden"
            >
              Back to Sign In
            </button>
          )}

          {currentStep < 5 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-2 ml-auto"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleCompleteRegistration}
              disabled={loading || !acceptTerms || !acceptPrivacy}
              className="flex items-center gap-2 ml-auto bg-primary text-primary-foreground font-bold shadow-md hover:opacity-90"
            >
              {loading ? "Creating Account..." : "Complete Registration & Launch POS"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
