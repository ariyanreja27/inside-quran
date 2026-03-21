import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider swipeDirection="up">
      {toasts.map(function ({ id, title, description, action, icon, variant, ...props }) {
        const iconColor = variant === "destructive" ? "text-maroon" : "text-emerald-600 dark:text-emerald-400";
        return (
          <Toast key={id} variant={variant} {...props}>
            {icon && <div className={cn("shrink-0", iconColor)}>{icon}</div>}
            <div className="flex-1 grid gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose className={iconColor} />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
