"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SignOutButton() {
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "Successfully signed out.",
      });
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({
        title: "Sign Out Failed",
        description: "Could not sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={handleSignOut} variant="ghost" size="sm">
      <LogOut className="mr-2 h-4 w-4" /> Sign Out
    </Button>
  );
}
