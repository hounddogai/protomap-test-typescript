import * as numbers from "../../../../kit/numbers.js";
import { TieredFunnelMapping } from "./tiered-funnel-mapping.js";

/** One step of the tiered funnel mapping calculation. */
export interface TieredFunnelMappingStep {
  describe(): string;
  adjust(item: TieredFunnelMapping, value: number): number;
}

export class CapTieredFunnelMappingAdjuster implements TieredFunnelMappingStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredFunnelMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTieredFunnelMappingAdjuster implements TieredFunnelMappingStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredFunnelMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UnitTieredFunnelMappingAdjuster implements TieredFunnelMappingStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: TieredFunnelMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered funnel mapping steps in order and keeps a trace of each. */
export class TieredFunnelMappingEngine {
  steps: TieredFunnelMappingStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredFunnelMappingStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredFunnelMapping): number {
    let current = item.effectiveExposure();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: TieredFunnelMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredFunnelMappingEngine(): TieredFunnelMappingEngine {
  return new TieredFunnelMappingEngine(
    [
      new CapTieredFunnelMappingAdjuster(27714),
      new RoundingTieredFunnelMappingAdjuster(0.25),
      new UnitTieredFunnelMappingAdjuster(new Map<string, number>([["north", 1.26]])),
    ],
    [],
    0.6,
    58555.2,
  );
}
