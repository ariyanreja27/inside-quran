import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-[6px] w-full grow rounded-full">
      <div className="absolute top-1/2 -translate-y-1/2 w-full h-[2px] bg-[#D2C8C8]/60 dark:bg-secondary rounded-full" />
      <SliderPrimitive.Range className="absolute h-full bg-primary rounded-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-[18px] w-[18px] rounded-full bg-primary ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing shadow-sm" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
