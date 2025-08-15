"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { Triangle, Mail, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsEmailSent(true);
        toast.success("Password sent to your email successfully!", {
          style: {
            borderRadius: "12px",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 600,
            fontSize: "1rem",
            boxShadow: "0 4px 24px 0 rgba(37,99,235,0.10)",
            padding: "16px 32px",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#2563eb"
          },
          position: "top-center",
        });
      } else {
        toast.error(data.error || "Email not found in our system", {
          style: {
            borderRadius: "12px",
            background: "#fff",
            color: "#dc2626",
            fontWeight: 600,
            fontSize: "1rem",
            border: "1.5px solid #dc2626",
            boxShadow: "0 4px 24px 0 rgba(220,38,38,0.10)",
            padding: "16px 32px",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#dc2626"
          },
          position: "top-center",
        });
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.", {
        style: {
          borderRadius: "12px",
          background: "#fff",
          color: "#dc2626",
          fontWeight: 600,
          fontSize: "1rem",
          border: "1.5px solid #dc2626",
          boxShadow: "0 4px 24px 0 rgba(220,38,38,0.10)",
          padding: "16px 32px",
        },
        iconTheme: {
          primary: "#fff",
          secondary: "#dc2626"
        },
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  const handleTryAgain = () => {
    setIsEmailSent(false);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 w-64 h-32 bg-pink-500/10 rounded-tr-full"></div>
        <div className="absolute bottom-20 left-20 w-32 h-16 bg-green-500/10 rounded-lg transform rotate-12"></div>
        <div className="absolute bottom-10 right-20 w-48 h-24 bg-blue-500/10 rounded-lg transform -rotate-12"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-slate-700/20 rounded-full transform translate-x-1/2"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0 relative z-10">
        <CardHeader className="text-center space-y-4 pb-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Triangle className="w-10 h-10 text-blue-600 fill-blue-600" />
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 w-5 h-5 rounded-sm transform rotate-45 -translate-y-1 translate-x-1"></div>
              </div>
              <span className="text-gray-900 text-2xl font-bold">TXS Digital Marketing</span>
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold text-gray-900">
            {isEmailSent ? "Check Your Email" : "Forgot Password"}
          </CardTitle>
          
          <CardDescription className="text-gray-600">
            {isEmailSent 
              ? "We've sent your password to your registered email address"
              : "Enter your registered email to receive your password"
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isEmailSent ? (
            // Email Input Form
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Registered Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg font-medium text-lg transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Send Password</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
            </form>
          ) : (
            // Success State
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  Your password has been sent to <span className="font-semibold text-gray-900">{email}</span>
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Please check your spam folder if you don&apos;t see the email in your inbox.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleBackToLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg font-medium text-lg transition-all duration-200"
                >
                  Back to Login
                </Button>
                
                <Button
                  onClick={handleTryAgain}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 h-12 rounded-lg font-medium transition-all duration-200"
                >
                  Try Another Email
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back to Home Link */}
      <div className="absolute top-6 left-6">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full shadow-md border-blue-500 bg-blue-500 hover:bg-blue-50 hover:border-blue-500 text-white font-semibold px-6 py-3 flex items-center gap-2 transition-all duration-200"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}
