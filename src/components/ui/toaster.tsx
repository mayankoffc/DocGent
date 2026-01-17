"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon = variant === "destructive" 
          ? AlertCircle 
          : variant === "success" 
          ? CheckCircle2 
          : variant === "warning"
          ? AlertTriangle
          : Info

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-3 items-start">
              <div className="mt-1">
                <Icon className="h-5 w-5" />
              </div>
              <div className="grid gap-1">
                {title && <ToastTitle className="font-semibold tracking-tight">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-sm opacity-90">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
