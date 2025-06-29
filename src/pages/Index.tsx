
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Lock } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import { toast } from "sonner";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Check if already logged in
    const loginStatus = localStorage.getItem("ashokaLogin");
    if (loginStatus === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple authentication - in real app, this would be more secure
    if (username === "admin" && password === "ashoka123") {
      setIsLoggedIn(true);
      localStorage.setItem("ashokaLogin", "true");
      toast.success("Welcome to Ashoka Resort Dashboard!");
    } else {
      toast.error("Invalid credentials. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("ashokaLogin");
    setUsername("");
    setPassword("");
    toast.success("Logged out successfully");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">Ashoka Resort</CardTitle>
              <p className="text-gray-600 mt-2">Daily Business Tracker</p>
              <p className="text-sm text-gray-500">Gangavati, Near Hampi</p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="h-12"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="h-12"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <Lock className="w-4 h-4 mr-2" />
                Login to Dashboard
              </Button>
              <div className="text-center text-sm text-gray-500 mt-4">
                Default: admin / ashoka123
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Dashboard onLogout={handleLogout} />;
};

export default Index;
