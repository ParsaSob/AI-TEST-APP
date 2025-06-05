"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Lightbulb, MessageSquareText } from "lucide-react";

interface MessageDisplayProps {
  originalMessage: string;
  aiEditedMessage?: string;
  aiExplanation?: string;
}

export default function MessageDisplay({ originalMessage, aiEditedMessage, aiExplanation }: MessageDisplayProps) {
  if (!originalMessage && !aiEditedMessage) return null;

  return (
    <div className="w-full space-y-6">
      {originalMessage && (
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

      {aiEditedMessage && (
        <Card className="shadow-lg rounded-xl overflow-hidden border-accent">
          <CardHeader className="bg-accent/20">
            <CardTitle className="flex items-center text-lg font-headline text-accent-foreground">
              <Lightbulb className="mr-3 h-6 w-6 text-accent" />
              AI Suggestion
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Suggested Edit:</h3>
              <p className="text-foreground whitespace-pre-wrap bg-background p-3 rounded-md border">{aiEditedMessage}</p>
            </div>
            {aiExplanation && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Explanation:</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{aiExplanation}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
