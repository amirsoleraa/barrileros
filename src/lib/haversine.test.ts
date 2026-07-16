import { describe, it, expect } from 'vitest';
import { haversineKm, calcDeliveryFee } from './haversine';

describe('haversineKm', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineKm(6.2442, -75.5812, 6.2442, -75.5812)).toBe(0);
  });

  it('is symmetric regardless of point order', () => {
    const a = haversineKm(6.2442, -75.5812, 4.7110, -74.0721);
    const b = haversineKm(4.7110, -74.0721, 6.2442, -75.5812);
    expect(a).toBeCloseTo(b, 6);
  });

  it('approximates the road-adjusted distance between Medellín and Bogotá', () => {
    // Straight-line ~245km * 1.3 road factor ≈ 320km
    const km = haversineKm(6.2442, -75.5812, 4.7110, -74.0721);
    expect(km).toBeGreaterThan(300);
    expect(km).toBeLessThan(340);
  });
});

describe('calcDeliveryFee', () => {
  it('charges distance times price per km', () => {
    expect(calcDeliveryFee(5, 1000)).toBe(5000);
  });

  it('never charges below the minimum fee', () => {
    expect(calcDeliveryFee(1, 1000, 4000)).toBe(4000);
  });

  it('rounds to the nearest peso', () => {
    expect(calcDeliveryFee(2.3333, 1000)).toBe(2333);
  });
});
