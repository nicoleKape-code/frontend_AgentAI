"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

// Carousel API interface
interface CarouselApi {
  scrollPrev(): void;
  scrollNext(): void;
  selectedScrollSnap(): number;
  scrollSnapList(): number[];
  on(event: string, callback: () => void): void;
}

// Basic carousel implementation
type CarouselProps = React.HTMLAttributes<HTMLDivElement> & {
  setApi?: (api: CarouselApi) => void;
};

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ className, setApi, children, ...props }, ref) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [slideCount, setSlideCount] = React.useState(0);
    
    React.useEffect(() => {
      if (React.Children.count(children) > 0) {
        setSlideCount(React.Children.count(children));
      }
    }, [children]);

    React.useEffect(() => {
      if (setApi) {
        const api: CarouselApi = {
          scrollPrev: () => setCurrentIndex(prev => Math.max(0, prev - 1)),
          scrollNext: () => setCurrentIndex(prev => Math.min(slideCount - 1, prev + 1)),
          selectedScrollSnap: () => currentIndex,
          scrollSnapList: () => Array.from({ length: slideCount }, (_, i) => i),
          on: (event: string, callback: () => void) => {
            // Simple event system - for real implementation would use proper event emitter
            if (event === 'select') {
              callback();
            }
          }
        };
        setApi(api);
      }
    }, [setApi, currentIndex, slideCount]);

    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex overflow-hidden", className)}
    {...props}
  />
))
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
    {...props}
  />
))
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "absolute left-4 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white p-2 shadow-sm hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800",
      className
    )}
    {...props}
  >
    <span className="sr-only">Previous</span>
    ←
  </button>
))
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "absolute right-4 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white p-2 shadow-sm hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800",
      className
    )}
    {...props}
  >
    <span className="sr-only">Next</span>
    →
  </button>
))
CarouselNext.displayName = "CarouselNext"

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}