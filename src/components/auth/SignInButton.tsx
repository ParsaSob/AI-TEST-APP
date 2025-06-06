
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
    } catch (error: any) {
      console.error("Error signing in with Google: ", error, error.code);
      if (error.code === 'auth/popup-closed-by-user') {
        toast({
          title: "Sign In Cancelled",
          description: "The Google sign-in popup was closed before completion.",
          variant: "default",
        });
      } else if (error.code === 'auth/cancelled-popup-request') {
        toast({
          title: "Sign In Interrupted",
          description: "The sign-in attempt was interrupted, possibly by a new sign-in request.",
          variant: "default",
        });
      } else if (error.code === 'auth/popup-blocked') {
        toast({
          title: "Sign In Blocked",
          description: "The sign-in popup was blocked by your browser. Please allow popups for this site.",
          variant: "destructive",
        });
      } else if (error.code === 'auth/unauthorized-domain') {
          toast({
            title: "Sign In Error",
            description: "This domain is not authorized for Google Sign-In. Please check your Firebase project's 'Authorized domains' settings.",
            variant: "destructive",
          });
      }
      else {
        toast({
          title: "Sign In Failed",
          description: `An error occurred: ${error.message || "Could not sign in with Google. Please try again."}`,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Button onClick={handleSignIn} variant="outline" className="shadow-md">
      <LogIn className="mr-2 h-4 w-4" /> Sign in with Google
    </Button>
  );
}
