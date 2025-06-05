
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import SignInButton from "@/components/auth/SignInButton";
import SignOutButton from "@/components/auth/SignOutButton";
import UserAvatar from "@/components/UserAvatar";
import MessageForm from "@/components/MessageForm";
import MessageDisplay from "@/components/MessageDisplay";
import { handleSendMessage } from "./actions";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Bot, Loader2, MessageSquareText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface AIResponseState {
  editedMessage?: string;
  explanation?: string;
}

export default function Home() {
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const [originalMessage, setOriginalMessage] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<AIResponseState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const submitMessage = async (message: string) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be signed in to send a message.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setError(null);
    setOriginalMessage(message); // Set original message for display immediately
    setAiResponse(null); // Clear previous AI response

    const result = await handleSendMessage(user.uid, message);

    if ("error" in result) {
      setError(result.error);
      toast({ title: "Error", description: result.error, variant: "destructive" });
      setAiResponse(null);
    } else {
      setAiResponse(result);
      toast({ title: "Success", description: "AI response received." });
    }
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="w-full max-w-md space-y-6">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-10 w-1/2 mx-auto rounded-lg" />
        </div>
      </div>
    );
  }
  
  if (authError) {
    return (
       <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            Failed to load user authentication. Please try refreshing the page. {authError.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-6 md:p-8 bg-background font-body selection:bg-primary/20 selection:text-primary-foreground">
      <header className="w-full max-w-2xl mb-8 flex justify-between items-center">
        <div className="flex items-center space-x-3">
           <Bot className="h-10 w-10 text-primary" />
           <h1 className="text-3xl sm:text-4xl font-headline font-bold text-foreground">
            AI Response App
          </h1>
        </div>
        {user && (
          <div className="flex items-center space-x-4">
            <UserAvatar user={user} />
            <SignOutButton />
          </div>
        )}
      </header>

      <main className="w-full max-w-2xl space-y-8">
        {!user ? (
          <div className="flex flex-col items-center justify-center p-10 bg-card rounded-xl shadow-xl border text-center">
            <Image src="https://placehold.co/300x200.png" alt="AI illustration" width={300} height={200} className="rounded-lg mb-6 shadow-md" data-ai-hint="abstract tech" />
            <h2 className="text-2xl font-semibold mb-3 text-foreground font-headline">Welcome!</h2>
            <p className="text-muted-foreground mb-6">
              Sign in to get AI-powered suggestions and improvements for your messages.
            </p>
            <SignInButton />
          </div>
        ) : (
          <>
            <MessageForm userId={user.uid} onSubmit={submitMessage} isLoading={isLoading} />
            
            {error && (
              <Alert variant="destructive" className="shadow-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {(originalMessage || aiResponse) && (
               <MessageDisplay 
                originalMessage={originalMessage}
                aiEditedMessage={aiResponse?.editedMessage}
                aiExplanation={aiResponse?.explanation}
              />
            )}
             {isLoading && !aiResponse && originalMessage && (
              <div className="w-full space-y-6">
                <Card className="shadow-lg rounded-xl overflow-hidden">
                  <CardHeader className="bg-secondary/50">
                    <CardTitle className="flex items-center text-lg font-headline text-secondary-foreground">
                      <MessageSquareText className="mr-3 h-6 w-6 text-primary" />
                      Your Message
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-foreground whitespace-pre-wrap">{originalMessage}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg rounded-xl overflow-hidden border-accent">
                  <CardHeader className="bg-accent/20">
                    <CardTitle className="flex items-center text-lg font-headline text-accent-foreground">
                       <Loader2 className="mr-3 h-6 w-6 text-accent animate-spin" />
                      AI Thinking...
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-8 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-5/6 rounded-md" />
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </main>
      <footer className="w-full max-w-2xl mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AI Response App. Enhance your communication.
        </p>
      </footer>
    </div>
  );
}
