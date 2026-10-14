import * as numbers from "../../../../kit/numbers.js";
import { PrimaryFunnelOverride } from "./primary-funnel-override.js";

/** One step of the primary funnel override calculation. */
export interface PrimaryFunnelOverrideStep {
  describe(): string;
  adjust(item: PrimaryFunnelOverride, value: number): number;
}

export class CapPrimaryFunnelOverrideAdjuster implements PrimaryFunnelOverrideStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryFunnelOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPrimaryFunnelOverrideAdjuster implements PrimaryFunnelOverrideStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryFunnelOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPrimaryFunnelOverrideAdjuster implements PrimaryFunnelOverrideStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryFunnelOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary funnel override steps in order and keeps a trace of each. */
export class PrimaryFunnelOverrideEngine {
  steps: PrimaryFunnelOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryFunnelOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryFunnelOverride): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: PrimaryFunnelOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryFunnelOverrideEngine(): PrimaryFunnelOverrideEngine {
  return new PrimaryFunnelOverrideEngine(
    [
      new CapPrimaryFunnelOverrideAdjuster(23319),
      new TieredPrimaryFunnelOverrideAdjuster([1883, 3821, 4852, 8960], [1.12, 1.15, 0.99, 0.93]),
      new PercentPrimaryFunnelOverrideAdjuster(-13.9),
    ],
    [],
    3.7,
    89315.3,
  );
}
