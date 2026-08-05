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
  Globe,
  Mail,
  CreditCard
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

const PACKAGES_CONFIG = [
  { 
    id: "starter", 
    name: "STARTER", 
    price: "TSh 8,500", 
    priceNum: 8500, 
    period: "/ Month",
    popular: false,
    badge: "Basic",
    features: [
      "1 Location",
      "1 User",
      "100 Products",
      "Basic Reports",
      "Unlimited Invoices & Receipts"
    ]
  },
  { 
    id: "kilimanjaro", 
    name: "KILIMANJARO", 
    price: "TSh 10,500", 
    priceNum: 10500, 
    period: "/ Month",
    popular: true,
    badge: "Popular",
    features: [
      "1 Location",
      "3 Users",
      "Unlimited Reports",
      "Unlimited Invoices & Receipts",
      "Multiple Branches"
    ]
  },
  { 
    id: "serengeti", 
    name: "SERENGETI", 
    price: "TSh 20,500", 
    priceNum: 20500, 
    period: "/ Month",
    popular: false,
    badge: "Enterprise",
    features: [
      "Unlimited Locations",
      "Unlimited Users",
      "Unlimited Products",
      "Unlimited Reports",
      "Unlimited Branches"
    ]
  }
];

export function MultiStepRegister({
  onSuccess,
  onSwitchToSignIn,
  inviteId,
  inviteRole = "cashier",
  inviteBranch = "",
  inviteBusinessName,
  initialPackage
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

  // Step 4: Package Selection
  const [selectedPackage, setSelectedPackage] = useState<string>(initialPackage || "kilimanjaro");

  // Step 5: Verification & Payment State
  const [paymentReference, setPaymentReference] = useState("");
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
          emailRedirectTo: window.location.origin,
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

  // Final Submission
  const handleCompleteRegistration = async () => {
    const cleanRef = paymentReference.trim();
    if (!cleanRef) {
      toast.error("Please enter your payment transaction reference number.");
      return;
    }
    if (cleanRef.length < 4) {
      toast.error("Please enter a valid payment reference number (at least 4 characters).");
      return;
    }
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

      // 1. Check duplicate email
      if (data?.user && data?.user?.identities?.length === 0) {
        toast.error("This email is already registered. Please sign in with your password.");
        onSwitchToSignIn();
        return;
      }

      // Sync profile & submit payment record for business
      if (data?.user) {
        try {
          const { data: userProf } = await supabase
            .from("profiles")
            .upsert({
              id: data.user.id,
              full_name: fullName,
              phone: phone,
              business_name: inviteId ? (inviteBusinessName || businessName) : businessName,
            })
            .select("business_id")
            .single();

          const bizId = userProf?.business_id;
          if (bizId) {
            const pkgObj = PACKAGES_CONFIG.find((p) => p.id === selectedPackage);
            const amount = pkgObj ? pkgObj.priceNum : 10500;

            await supabase
              .from("businesses")
              .update({
                package: selectedPackage as any,
                account_status: "pending",
                rejection_reason: null as any,
              })
              .eq("id", bizId);

            await supabase.from("payments").insert({
              business_id: bizId,
              amount: amount,
              payment_reference: cleanRef,
              verification_status: "waiting_verification",
            });

            await supabase.from("notifications" as any).insert({
              business_id: bizId,
              title: "Payment Reference Submitted",
              message: `Your payment reference (${cleanRef}) for ${pkgObj?.name || selectedPackage} has been submitted for admin verification.`,
              type: "payment",
            });
          }
        } catch (e) {
          console.warn("Profile/Payment sync error on registration:", e);
        }
      }

      // 2. If user session is returned immediately
      if (data?.session) {
        toast.success("Registration & Payment submitted! Awaiting admin verification.");
        onSuccess();
        return;
      }

      // 3. Email activation link sent by Supabase
      setEmailSentSuccess(true);
      toast.success(`Activation link sent to ${email}`);
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
    { number: 4, label: "Choose Package", icon: Package },
    { number: 5, label: "Verification & Payment", icon: ShieldCheck },
  ];

  if (emailSentSuccess) {
    return (
      <div className="w-full max-w-lg mx-auto bg-card border border-border rounded-2xl p-6 md:p-8 shadow-[var(--shadow-elevated)] text-center space-y-6 animate-in fade-in-50 duration-300">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto ring-8 ring-primary/5">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Check Your Email Inbox</h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            We sent an account activation link to <span className="font-bold text-foreground">{email}</span>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-left text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">Important Next Steps:</p>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            <li>Open your email inbox and click <strong>"Confirm Email"</strong>.</li>
            <li>Check your <strong>Spam or Junk</strong> folder if it does not appear in 1-2 minutes.</li>
            <li>Once confirmed, your payment reference will be processed by our admin team.</li>
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
            {resendingEmail ? "Sending..." : "Resend Activation Email"}
          </Button>
          <Button
            type="button"
            onClick={onSwitchToSignIn}
            className="w-full font-semibold"
          >
            Proceed to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-card border border-border rounded-2xl p-6 md:p-8 shadow-[var(--shadow-elevated)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {currentStep === 1 && "Create Your Account"}
            {currentStep === 2 && "Physical Store Location"}
            {currentStep === 3 && "Business Information"}
            {currentStep === 4 && "Select Subscription Plan"}
            {currentStep === 5 && "Payment & Account Verification"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Step {currentStep} of 5 — {STEPS_CONFIG.find((s) => s.number === currentStep)?.label}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
            POS Setup
          </span>
        </div>
      </div>

      {/* Step Stepper Indicator */}
      <div className="mb-8">
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
                  {isCompleted ? <Check className="w-4 h-4" /> : <IconComponent className="w-4 h-4" />}
                </div>
                <span className={`text-[10px] font-semibold text-center hidden md:block truncate max-w-[80px] ${
                  isCurrent ? "text-primary" : "text-muted-foreground"
                }`}>
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
      <div className="space-y-6">
        {/* STEP 1: USER ACCOUNT */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            <div>
              <Label htmlFor="fullName" className="text-sm font-semibold">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="e.g. Baraka Joseph"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-sm font-semibold">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. baraka@store.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-semibold">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g. 0754123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password" className="text-sm font-semibold">Password *</Label>
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
                <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password *</Label>
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
                <Label className="text-sm font-semibold">Country *</Label>
                <div className="mt-1.5 p-2.5 rounded-lg border border-border bg-muted/40 font-bold text-xs text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> {country}
                </div>
              </div>

              <div>
                <Label htmlFor="region" className="text-sm font-semibold">Region / Region *</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select region" />
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
              <Label htmlFor="district" className="text-sm font-semibold">City / District / Area *</Label>
              <Input
                id="district"
                placeholder="e.g. Kinondoni, Kariakoo, Arusha Urban"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-sm font-semibold">Physical Street / Building Address *</Label>
              <Input
                id="address"
                placeholder="e.g. Swahili Street, House No. 12, Floor 1"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1.5"
                required
              />
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

        {/* STEP 4: PACKAGE SELECTION */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            <div>
              <h3 className="text-base font-bold text-foreground">Select Your POS Subscription Plan</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose the plan that best fits your shop requirements. You can upgrade anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {PACKAGES_CONFIG.map((pkg) => {
                const isSelected = selectedPackage === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`rounded-2xl border-2 p-4 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md scale-[1.01]"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        Popular
                      </span>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          {pkg.badge}
                        </span>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </div>

                      <h4 className="text-lg font-extrabold text-foreground">{pkg.name}</h4>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-primary">{pkg.price}</span>
                        <span className="text-xs text-muted-foreground">{pkg.period}</span>
                      </div>

                      <ul className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/60">
                        {pkg.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className="w-full text-xs font-bold py-2 h-auto"
                      onClick={() => setSelectedPackage(pkg.id)}
                    >
                      {isSelected ? "Selected Plan ✓" : `Choose ${pkg.name}`}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: VERIFICATION & PAYMENT */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-in fade-in-50 duration-300">
            {/* Selected Package Banner */}
            {(() => {
              const activePkg = PACKAGES_CONFIG.find((p) => p.id === selectedPackage) || PACKAGES_CONFIG[1];
              return (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Chosen Subscription Plan</span>
                    <h4 className="text-base font-extrabold text-foreground">{activePkg.name} PLAN</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-primary">{activePkg.price}</span>
                    <span className="text-xs text-muted-foreground block">{activePkg.period}</span>
                  </div>
                </div>
              );
            })()}

            {/* Payment Methods (Njia za Malipo) */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-primary" /> Tanzanian Payment Channels (Lipa Hapa)
                </span>
                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Instant Verification
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-border/60 bg-muted/30 space-y-1">
                  <span className="font-bold text-blue-600 block">🔵 Mix By Yas</span>
                  <p className="font-mono text-xs font-semibold text-foreground">Number: 0674673494</p>
                </div>

                <div className="p-2.5 rounded-lg border border-border/60 bg-muted/30 space-y-1">
                  <span className="font-bold text-emerald-600 block">🟢 Airtel Money</span>
                  <p className="font-mono text-xs font-semibold text-foreground">Number: 0668632187</p>
                </div>

                <div className="p-2.5 rounded-lg border border-border/60 bg-muted/30 space-y-1">
                  <span className="font-bold text-amber-600 block">🟠 Halopesa</span>
                  <p className="font-mono text-xs font-semibold text-foreground">Number: 0627274168</p>
                </div>

                <div className="p-2.5 rounded-lg border border-border/60 bg-muted/30 space-y-1">
                  <span className="font-bold text-purple-600 block">🏦 NMB Bank</span>
                  <p className="font-mono text-xs font-semibold text-foreground">Acc: 40310127484</p>
                </div>
              </div>
            </div>

            {/* Payment Reference Input */}
            <div className="space-y-1.5">
              <Label htmlFor="paymentReference" className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Payment Transaction Reference Code *</span>
                <span className="text-[10px] font-normal text-muted-foreground">Required for verification</span>
              </Label>
              <Input
                id="paymentReference"
                placeholder="e.g. QGH89231KL or TXN-98210"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="font-mono font-bold tracking-wider text-sm"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Enter the receipt transaction code from your M-Pesa / TigoPesa / Airtel Money / Bank payment confirmation SMS.
              </p>
            </div>

            {/* Terms & Privacy Checkboxes */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-start space-x-2.5">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-xs leading-relaxed text-muted-foreground font-normal cursor-pointer">
                  I have read and agree to the <span className="text-primary font-semibold underline">MauzoChap Terms & Conditions</span> governing POS operations and account access.
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
                  I agree to the <span className="text-primary font-semibold underline">Privacy Policy</span> regarding store inventory & transaction data privacy.
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
              disabled={loading || !paymentReference.trim() || !acceptTerms || !acceptPrivacy}
              className="flex items-center gap-2 ml-auto bg-primary text-primary-foreground font-bold shadow-md hover:opacity-90"
            >
              {loading ? "Submitting Payment..." : "Complete Registration & Submit Payment"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
