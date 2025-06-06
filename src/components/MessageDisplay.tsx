
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquareText } from "lucide-react"; // Changed Lightbulb to Bot

interface MessageDisplayProps {
  originalMessage: string;
  aiResponse?: string;
}

export default function MessageDisplay({ originalMessage, aiResponse }: MessageDisplayProps) {
  if (!originalMessage && !aiResponse) return null;

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

      {aiResponse && (
        <Card className="shadow-lg rounded-xl overflow-hidden border-accent">
          <CardHeader className="bg-accent/20">
            <CardTitle className="flex items-center text-lg font-headline text-accent-foreground">
              <Bot className="mr-3 h-6 w-6 text-accent" />
              AI Response
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-foreground whitespace-pre-wrap bg-background p-3 rounded-md border">{aiResponse}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
