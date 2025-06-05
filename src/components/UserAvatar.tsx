"use client";

import type { User } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle } from "lucide-react";

interface UserAvatarProps {
  user: User | null;
}

export default function UserAvatar({ user }: UserAvatarProps) {
  if (!user) return null;

  const initials = user.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.[0].toUpperCase() ?? <UserCircle className="h-5 w-5" />;

  return (
    <div className="flex items-center space-x-3">
      <Avatar className="h-10 w-10 border-2 border-primary shadow-sm">
        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User Avatar"} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium text-foreground truncate max-w-[150px]">{user.displayName || "User"}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
      </div>
    </div>
  );
}
