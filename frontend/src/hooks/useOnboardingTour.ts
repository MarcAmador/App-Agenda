import { useTour } from '@/context/TourContext'

/**
 * Hook de compatibilidad que redirige al TourContext global con soporte multi-página.
 */
export function useOnboardingTour() {
  return useTour()
}
