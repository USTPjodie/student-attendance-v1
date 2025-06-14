import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { login, type LoginCredentials } from "@/lib/auth";
import { GraduationCap } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [loginType, setLoginType] = useState<"teacher" | "student">("teacher");
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (data: LoginCredentials) => login(data),
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], { user });
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.firstName}!`,
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      ...credentials,
      role: loginType,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ustp-navy to-ustp-navy-light flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-ustp-navy rounded-full mx-auto mb-4 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">USTP Attendance</h1>
            <p className="text-slate-600 mt-2">Management System</p>
          </div>

          {/* Login Type Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => setLoginType("teacher")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                loginType === "teacher"
                  ? "bg-ustp-navy text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => setLoginType("student")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                loginType === "student"
                  ? "bg-ustp-navy text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Student
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-ustp-navy hover:bg-ustp-navy-light"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a href="#" className="text-sm text-ustp-navy hover:text-ustp-navy-light">
              Forgot your password?
            </a>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">Demo Credentials:</p>
            <div className="text-xs text-slate-600 space-y-1">
              <p><strong>Teacher:</strong> prof.smith@ustp.edu.ph / password123</p>
              <p><strong>Student:</strong> alice.doe@student.ustp.edu.ph / password123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
