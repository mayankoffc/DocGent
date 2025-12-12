
"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, User, Crown } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { chatWithAssistant } from "@/ai/flows/chat-with-assistant";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useTranslation } from "@/hooks/use-translation";
import { useSubscription } from "@/hooks/use-subscription";
import { isPremiumTool } from "@/config/subscriptions";

interface Message {
  text: string;
  isUser: boolean;
}

interface AiAssistantProps {
  setSubscriptionModalOpen: (isOpen: boolean) => void;
}

export function AiAssistant({ setSubscriptionModalOpen }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { subscription } = useSubscription();
  
  const isPremium = isPremiumTool('ai-assistant');
  const hasAccess = !isPremium || subscription.status === 'active';


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !hasAccess) return;

    const userMessage: Message = { text: input, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatWithAssistant({ question: input });
      const aiMessage: Message = { text: response.answer, isUser: false };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        text: t('aiAssistantError'),
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error("AI Assistant Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerClick = () => {
    if (hasAccess) {
      setIsOpen(prev => !prev);
    } else {
      setSubscriptionModalOpen(true);
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          onClick={handleTriggerClick}
          className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-lg bg-primary hover:bg-primary/90 transition-all duration-300 animate-float-glow"
        >
          {!hasAccess && (
              <Crown className="w-5 h-5 absolute -top-1 -right-1 text-yellow-400" fill="currentColor" />
          )}
          <Bot className="w-8 h-8 text-primary-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-80 sm:w-96 rounded-2xl shadow-2xl p-0 border-none bg-card/80 backdrop-blur-xl"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-[60vh]">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-lg text-center font-headline">{t('aiAssistantTitle')}</h3>
            <p className="text-sm text-muted-foreground text-center">{t('aiAssistantDescription')}</p>
          </div>
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className="p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3",
                    message.isUser ? "justify-end" : "justify-start"
                  )}
                >
                  {!message.isUser && (
                    <Avatar className="w-8 h-8 border">
                       <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20} /></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-xs rounded-2xl px-4 py-2 text-sm",
                      message.isUser
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted rounded-bl-none"
                    )}
                  >
                    {message.text}
                  </div>
                   {message.isUser && (
                     <Avatar className="w-8 h-8 border">
                       <AvatarFallback><User size={18}/></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-start gap-3 justify-start">
                    <Avatar className="w-8 h-8 border">
                       <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20} /></AvatarFallback>
                    </Avatar>
                    <div className="max-w-xs rounded-2xl px-4 py-2 text-sm bg-muted rounded-bl-none flex items-center">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend()}
                placeholder={t('aiAssistantPlaceholder')}
                className="flex-1"
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading} size="icon" className="shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
