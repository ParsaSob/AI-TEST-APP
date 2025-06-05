"use client";

import { useState, type FormEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface MessageFormProps {
  userId: string | undefined;
  onSubmit: (message: string) => Promise<void>;
  isLoading: boolean;
}

export default function MessageForm({ userId, onSubmit, isLoading }: MessageFormProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !userId) return;
    await onSubmit(message);
    setMessage(""); // Clear message input after submission
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message here..."
        className="min-h-[100px] rounded-lg shadow-sm focus:ring-primary focus:border-primary"
        disabled={isLoading || !userId}
        aria-label="Message Input"
      />
      <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-shadow duration-200" disabled={isLoading || !userId || !message.trim()}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Send Message
      </Button>
    </form>
  );
}
