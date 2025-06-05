"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SignInButton() {
  const { toast } = useToast();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Signed In",
        description: "Successfully signed in with Google.",
      });
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      toast({
        title: "Sign In Failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={handleSignIn} variant="outline" className="shadow-md">
      <LogIn className="mr-2 h-4 w-4" /> Sign in with Google
    </Button>
  );
}
