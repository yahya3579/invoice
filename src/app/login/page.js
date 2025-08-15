"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { Triangle, Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Logged in successfully", {
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
        setTimeout(() => {
          const role = data?.user?.role;
          if (role === "admin") router.push("/admin");
          else router.push("/user");
        }, 1200);
      } else {
        toast.error(data.error || "Invalid credentials", {
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
      toast.error("Something went wrong", {
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

      {/* Login Card */}
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
          
          
          <CardDescription className="text-gray-600">
            Sign in to your TXS Digital Marketing account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Registered Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Account Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                  Remember me
                </Label>
              </div>
              <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg font-medium text-lg transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Back to Home Link */}
      <div className="absolute top-6 left-6">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full shadow-md border-blue-500 bg-blue-500 hover:bg-blue-50 hover:border-blue-500 text-white font-semibold px-6 py-3 flex items-center gap-2 transition-all duration-200"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}