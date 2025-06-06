
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import SignInButton from "@/components/auth/SignInButton";
import SignOutButton from "@/components/auth/SignOutButton";
import UserAvatar from "@/components/UserAvatar";
import MessageForm from "@/components/MessageForm";
import MessageDisplay from "@/components/MessageDisplay";
import { handleSendMessage } from "./actions";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Loader2, MessageSquareText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface AIResponseState {
  aiResponse?: string;
}

export default function Home() {
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const [originalMessage, setOriginalMessage] = useState<string>("");
  const [aiServiceResponse, setAiServiceResponse] = useState<AIResponseState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const resetStateForNewMessage = useCallback(() => {
    console.log("[PageReset] Resetting state for new message.");
    setAiServiceResponse(null);
    setError(null);
  }, []);

  const submitMessage = async (message: string) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be signed in to send a message.", variant: "destructive" });
      return;
    }

    console.log("[PageSubmit] submitMessage called with message:", message);
    resetStateForNewMessage();
    setOriginalMessage(message);
    setIsLoading(true);
    console.log("[PageSubmit] State reset. isLoading is now true.");

    try {
      console.log("[PageSubmit] Calling handleSendMessage action (Genkit direct)...");
      const result = await handleSendMessage(user.uid, message);
      console.log("[PageSubmit] handleSendMessage action result:", result);

      if (result && result.success && result.aiResponse) {
        console.log(`[PageSubmit] handleSendMessage successful. AI Response: ${result.aiResponse}`);
        setAiServiceResponse({ aiResponse: result.aiResponse });
        setError(null);
        toast({ title: "Success", description: "AI response received." });
      } else {
        const errorMessage = result?.error || "Failed to get AI response. Unexpected response from server action.";
        console.error("[PageSubmit] handleSendMessage failed or returned unexpected result:", errorMessage, result);
        setError(errorMessage);
        setAiServiceResponse(null);
        toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
      }
    } catch (e: any) {
      console.error("[PageSubmit] Critical error during handleSendMessage call:", e);
      const errorMessage = e.message || "An unexpected client-side error occurred while sending the message.";
      setError(errorMessage);
      setAiServiceResponse(null);
      toast({ title: "Submission Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
      console.log("[PageSubmit] isLoading is now false.");
    }
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
      <header className="w-full max-w-2xl mb-8 grid grid-cols-3 items-center">
        <div className="flex justify-start">
          {/* This div is intentionally left empty to balance the layout when user info is present on the right. */}
        </div>
        <div className="flex justify-center items-center col-start-2">
           <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-10 w-10 text-primary mr-3"
            aria-label="App Logo"
          >
            <path d="M12 2.032c-1.431.001-2.814.282-4.095.799C5.03 3.87 3.431 5.62 2.268 7.895c-.995 1.94-1.25 3.956-1.138 5.897.126 2.153.833 4.026 2.033 5.59.189.246.4.485.62.714.441.459.923.921 1.422 1.365 1.757 1.563 3.678 2.444 5.792 2.502h.001c2.115-.058 4.035-.939 5.792-2.502.499-.444.981-.906 1.422-1.365.22-.229.431-.468.62-.714 1.2-1.564 1.907-3.437 2.033-5.59.112-1.941-.143-3.957-1.138-5.897C20.569 5.62 18.97 3.87 16.095 2.831c-1.281-.517-2.664-.798-4.095-.799zm-.001 1.93c1.101 0 2.15.21 3.135.616.928.39 1.787.927 2.51 1.585.095.085.186.176.271.269.431.462.789.972 1.061 1.519.511 1.02.773 2.119.773 3.216 0 .834-.132 1.734-.388 2.585-.044.147-.09.293-.138.438-.386 1.162-1.044 2.222-1.888 3.126a9.013 9.013 0 0 1-1.24 1.21c-.014.012-.027.024-.041.036-.06.054-.12.107-.181.159-.217.185-.438.366-.662.54-.872.677-1.815 1.173-2.823 1.453-.126.035-.252.068-.379.099a4.737 4.737 0 0 1-1.04.158h-.003a4.738 4.738 0 0 1-1.04-.158c-.127-.031-.253-.064-.379-.099-.998-.28-1.941-.776-2.823-1.453-.224-.174-.445-.355-.662-.54-.061-.052-.121-.105-.181-.159-.014-.012-.027-.024-.041-.036a9.013 9.013 0 0 1-1.24-1.21c-.844-.904-1.502-1.964-1.888-3.126-.048-.145-.094-.291-.138-.438-.256-.851-.388-1.751-.388-2.585 0-1.097.262-2.196.773-3.216.272-.547.63-1.057 1.061-1.519.085-.093.176-.184.271-.269.723-.658 1.582-1.195 2.51-1.585.985-.406 2.034-.616 3.135-.616z" />
          </svg>
           <h1 className="text-3xl sm:text-4xl font-headline font-bold text-foreground">
            AI Response App
          </h1>
        </div>
        <div className="flex justify-end col-start-3">
          {user && (
            <div className="flex items-center space-x-4">
              <UserAvatar user={user} />
              <SignOutButton />
            </div>
          )}
        </div>
      </header>

      <main className="w-full max-w-2xl space-y-8">
        {!user ? (
          <div className="flex flex-col items-center justify-center p-10 bg-card rounded-xl shadow-xl border text-center">
            <Image 
              src="https://easy-peasy.ai/cdn-cgi/image/quality=80,format=auto,width=700/https://media.easy-peasy.ai/08f66451-53e5-4d99-bf10-5a4f3b4ab1dd/2296e206-0fe3-48bb-89bd-776d3622b8e7.png" 
              alt="Illustration of a dark silhouette head with a brightly lit, circuit-like brain" 
              width={250} 
              height={250} 
              className="rounded-lg mb-6 shadow-md" 
              data-ai-hint="AI brain" 
              priority
            />
            <h2 className="text-2xl font-semibold mb-3 text-foreground font-headline">Welcome!</h2>
            <p className="text-muted-foreground mb-6">
              Sign in to get AI-powered responses for your messages.
            </p>
            <SignInButton />
          </div>
        ) : (
          <>
            <MessageForm userId={user.uid} onSubmit={submitMessage} isLoading={isLoading} />
            
            {error && !isLoading && ( 
              <Alert variant="destructive" className="shadow-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {originalMessage && (!error || isLoading) && ( 
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
            )}
            
            {isLoading && (
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
            )}
            
            {aiServiceResponse?.aiResponse && !isLoading && !error && (
               <MessageDisplay
                aiResponse={aiServiceResponse.aiResponse}
              />
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
