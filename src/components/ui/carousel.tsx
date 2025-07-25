"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselProps = {
  children: React.ReactNode
  className?: string
  autoPlay?: boolean
  interval?: number
  showArrows?: boolean
  showDots?: boolean
}

type CarouselContextProps = {
  currentSlide: number
  totalSlides: number
  goToSlide: (index: number) => void
  nextSlide: () => void
  prevSlide: () => void
  canGoNext: boolean
  canGoPrev: boolean
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      children,
      className,
      autoPlay = false,
      interval = 3000,
      showArrows = true,
      showDots = true,
      ...props
    },
    ref
  ) => {
    const [currentSlide, setCurrentSlide] = React.useState(0)
    const [totalSlides, setTotalSlides] = React.useState(0)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const goToSlide = React.useCallback((index: number) => {
      if (index >= 0 && index < totalSlides) {
        setCurrentSlide(index)
      }
    }, [totalSlides])

    const nextSlide = React.useCallback(() => {
      goToSlide(currentSlide + 1)
    }, [currentSlide, goToSlide])

    const prevSlide = React.useCallback(() => {
      goToSlide(currentSlide - 1)
    }, [currentSlide, goToSlide])

    const canGoNext = currentSlide < totalSlides - 1
    const canGoPrev = currentSlide > 0

    // Auto-play functionality
    React.useEffect(() => {
      if (!autoPlay) return

      const timer = setInterval(() => {
        if (canGoNext) {
          nextSlide()
        } else {
          goToSlide(0)
        }
      }, interval)

      return () => clearInterval(timer)
    }, [autoPlay, interval, canGoNext, nextSlide, goToSlide])

    // Count total slides
    React.useEffect(() => {
      if (containerRef.current) {
        const slides = containerRef.current.children
        setTotalSlides(slides.length)
      }
    }, [children])

    const contextValue = React.useMemo(() => ({
      currentSlide,
      totalSlides,
      goToSlide,
      nextSlide,
      prevSlide,
      canGoNext,
      canGoPrev,
    }), [currentSlide, totalSlides, goToSlide, nextSlide, prevSlide, canGoNext, canGoPrev])

    return (
      <CarouselContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          <div
            ref={containerRef}
            className="flex transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
            }}
          >
            {children}
          </div>

          {showArrows && (
            <>
              <CarouselPrevious />
              <CarouselNext />
            </>
          )}

          {showDots && totalSlides > 1 && (
            <CarouselDots />
          )}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex-shrink-0 w-full", className)}
      {...props}
    />
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn("w-full", className)}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { prevSlide, canGoPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full -left-12 top-1/2 -translate-y-1/2",
        className
      )}
      disabled={!canGoPrev}
      onClick={prevSlide}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { nextSlide, canGoNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full -right-12 top-1/2 -translate-y-1/2",
        className
      )}
      disabled={!canGoNext}
      onClick={nextSlide}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

const CarouselDots = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { currentSlide, totalSlides, goToSlide } = useCarousel()

  return (
    <div
      ref={ref}
      className={cn("flex justify-center space-x-2 mt-4", className)}
      {...props}
    >
      {Array.from({ length: totalSlides }).map((_, index) => (
        <button
          key={index}
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            currentSlide === index
              ? "bg-primary"
              : "bg-muted hover:bg-muted-foreground"
          )}
          onClick={() => goToSlide(index)}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  )
})
CarouselDots.displayName = "CarouselDots"

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
}
