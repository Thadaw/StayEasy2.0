export const calcPrice = (basePrice: number, maxGuests: number, guests: number) => {
  if (maxGuests <= 1) return basePrice;
  return Math.round(basePrice * (0.85 + 0.15 * (guests - 1) / (maxGuests - 1)));
};
