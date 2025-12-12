
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Eye, EyeOff, KeyRound, CheckCircle } from "lucide-react";
import { Logo } from "@/components/icons";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.357-11.297-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.99,35.536,44,30.169,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

type AuthMode = 'login' | 'signup';
type Step = 'credentials' | 'otp';
type ForgotPasswordStep = 'email' | 'otp' | 'new_password' | 'success';


export default function LoginPage() {
    const [mode, setMode] = useState<AuthMode>('login');
    const [step, setStep] = useState<Step>('credentials');
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Forgot Password State
    const [isForgotPwdDialogOpen, setForgotPwdDialogOpen] = useState(false);
    const [forgotPwdStep, setForgotPwdStep] = useState<ForgotPasswordStep>('email');
    const [forgotPwdEmail, setForgotPwdEmail] = useState("");
    const [forgotPwdOtp, setForgotPwdOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const router = useRouter();
    const { signIn, signUp, signInWithGoogle, verifySignUpOtp, requestPasswordResetOtp, resetPasswordWithOtp } = useAuth();
    const { toast } = useToast();

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
            toast({ title: "Success", description: "Successfully signed in with Google." });
            router.push("/");
        } catch (error: any) {
            // Error is handled in the auth hook, no need for toast here
        } finally {
            setLoading(false);
        }
    };
    
    const handleLogin = async () => {
        setLoading(true);
        try {
            await signIn(email, password);
            toast({ title: "Success", description: `Welcome back!` });
            router.push("/");
        } catch (error: any) {
            toast({ variant: "destructive", title: "Login Failed", description: error.message || 'An unknown error occurred.' });
        } finally {
            setLoading(false);
        }
    }

    const handleSignUp = async () => {
        if (password !== confirmPassword) {
            toast({ variant: "destructive", title: "Passwords do not match", description: "Please ensure both passwords are the same." });
            return;
        }
        setLoading(true);
        try {
            await signUp(name, email, password);
            setStep('otp');
            toast({ title: "Verification Code Sent", description: "Please check your email for the OTP." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Sign Up Failed", description: error.message || 'An unknown error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySignUp = async () => {
        setLoading(true);
        try {
            await verifySignUpOtp(email, otp);
            toast({ title: "Account Verified!", description: "Welcome! You are now logged in." });
            router.push('/');
        } catch(error: any) {
            toast({ variant: "destructive", title: "Verification Failed", description: error.message || "The OTP you entered is incorrect." });
        } finally {
            setLoading(false);
        }
    }
    
    const handleRequestResetOtp = async () => {
        if (!forgotPwdEmail) {
            toast({ variant: "destructive", title: "Email Required", description: "Please enter your email address." });
            return;
        }
        setLoading(true);
        try {
            await requestPasswordResetOtp(forgotPwdEmail);
            setForgotPwdStep('otp');
            toast({ title: "OTP Sent", description: "Please check your email for the verification code." });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Request Failed", description: error.message || "Could not send reset code." });
        } finally {
            setLoading(false);
        }
    }

    const handleResetPassword = async () => {
        setLoading(true);
        try {
            await resetPasswordWithOtp(forgotPwdEmail, forgotPwdOtp, newPassword);
            setForgotPwdStep('success');
        } catch (error: any) {
            toast({ variant: "destructive", title: "Reset Failed", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleGuestAccess = () => {
        sessionStorage.setItem('isGuest', 'true');
        router.push('/');
    }
    
    const renderForgotPasswordDialog = () => {
        switch (forgotPwdStep) {
            case 'email':
                return <>
                    <DialogHeader><DialogTitle>Reset Your Password</DialogTitle><DialogDescription>Enter your email address to receive a verification code.</DialogDescription></DialogHeader>
                    <div className="space-y-2 pt-2"><Label htmlFor="forgot-email">Email</Label><Input id="forgot-email" type="email" placeholder="m@example.com" required value={forgotPwdEmail} onChange={e => setForgotPwdEmail(e.target.value)} /></div>
                    <DialogFooter><Button onClick={handleRequestResetOtp} disabled={loading} className="w-full">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Verification Code"}</Button></DialogFooter>
                </>;
            case 'otp':
                 return <>
                    <DialogHeader><DialogTitle>Enter Verification Code</DialogTitle><DialogDescription>A 6-digit code has been sent to {forgotPwdEmail}. Please check your spam folder too.</DialogDescription></DialogHeader>
                    <div className="space-y-2 pt-2"><Label htmlFor="forgot-otp">OTP Code</Label><Input id="forgot-otp" type="text" placeholder="Enter OTP" required value={forgotPwdOtp} onChange={e => setForgotPwdOtp(e.target.value)} maxLength={6} /></div>
                    <DialogFooter><Button onClick={() => setForgotPwdStep('new_password')} className="w-full">Verify OTP</Button></DialogFooter>
                </>;
            case 'new_password':
                 return <>
                    <DialogHeader><DialogTitle>Set New Password</DialogTitle><DialogDescription>Enter a new password for your account.</DialogDescription></DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2"><Label htmlFor="new-password">New Password</Label><Input id="new-password" type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
                    </div>
                    <DialogFooter><Button onClick={handleResetPassword} disabled={loading} className="w-full">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset Password"}</Button></DialogFooter>
                </>;
            case 'success':
                 return <>
                    <DialogHeader className="items-center text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mb-2"/>
                        <DialogTitle>Password Reset!</DialogTitle>
                        <DialogDescription>Your password has been changed successfully. You can now log in.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter><Button onClick={() => setForgotPwdDialogOpen(false)} className="w-full">Close</Button></DialogFooter>
                </>;
        }
    }


    const renderCurrentStep = () => {
        if (step === 'otp') {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle>Verify Your Email</CardTitle>
                        <CardDescription>Enter the 6-digit code sent to {email}.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="otp">Verification Code</Label><Input id="otp" type="text" placeholder="Enter 6-digit OTP" required value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} /></div>
                        <p className="text-xs text-muted-foreground">Please also check your spam folder.</p>
                    </CardContent>
                    <CardFooter className="flex-col gap-4">
                        <Button className="w-full" onClick={handleVerifySignUp} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify & Continue"}</Button>
                        <Button variant="link" onClick={() => setStep('credentials')}>Back to Login</Button>
                    </CardFooter>
                </Card>
            )
        }

        return (
          <Tabs defaultValue={mode} onValueChange={(v) => setMode(v as AuthMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Card>
                <CardHeader><CardTitle>Welcome Back</CardTitle><CardDescription>Sign in to your account to continue.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="login-email">Email</Label><Input id="login-email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                        <Input id="login-password" type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} />
                        <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                           {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                    <Button className="w-full" onClick={handleLogin} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Login</Button>
                    <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}><GoogleIcon className="mr-2"/> Sign in with Google</Button>
                     <Dialog open={isForgotPwdDialogOpen} onOpenChange={setForgotPwdDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="link" className="text-sm">Forgot Password?</Button>
                        </DialogTrigger>
                        <DialogContent>
                            {renderForgotPasswordDialog()}
                        </DialogContent>
                     </Dialog>
                    <div className="relative w-full my-2"><Separator /><span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card px-2 text-xs text-muted-foreground">OR</span></div>
                    <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleGuestAccess}><User className="mr-2 h-4 w-4"/> Continue as Guest</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="signup">
              <Card>
                <CardHeader><CardTitle>Create an Account</CardTitle><CardDescription>Enter your details to get started.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="signup-name">Full Name</Label><Input id="signup-name" type="text" placeholder="John Doe" required value={name} onChange={e => setName(e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="signup-email">Email</Label><Input id="signup-email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="signup-password">Password</Label>
                     <div className="relative">
                        <Input id="signup-password" type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} />
                        <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                           {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="signup-confirm-password">Confirm Password</Label><Input id="signup-confirm-password" type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></div>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                    <Button className="w-full" onClick={handleSignUp} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign Up & Verify Email</Button>
                    <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}><GoogleIcon className="mr-2"/> Sign up with Google</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )
    }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <Logo className="w-8 h-8 text-primary" />
        <span className="text-xl font-bold font-headline">DOC AI</span>
      </div>
      <div className="w-full max-w-md">
        {renderCurrentStep()}
      </div>
    </div>
  );
}
