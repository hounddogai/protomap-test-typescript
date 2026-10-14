import * as numbers from "../../../../kit/numbers.js";
import { LenientRewardAudit } from "./lenient-reward-audit.js";

/** One step of the lenient reward audit calculation. */
export interface LenientRewardAuditAdjuster {
  describe(): string;
  adjust(item: LenientRewardAudit, value: number): number;
}

export class CapLenientRewardAuditAdjuster implements LenientRewardAuditAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientRewardAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredLenientRewardAuditAdjuster implements LenientRewardAuditAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientRewardAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLenientRewardAuditAdjuster implements LenientRewardAuditAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientRewardAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient reward audit steps in order and keeps a trace of each. */
export class LenientRewardAuditEngine {
  steps: LenientRewardAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientRewardAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientRewardAudit): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: LenientRewardAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientRewardAuditEngine(): LenientRewardAuditEngine {
  return new LenientRewardAuditEngine(
    [
      new CapLenientRewardAuditAdjuster(47646),
      new TieredLenientRewardAuditAdjuster([1060, 2029, 4928, 7375], [0.95, 1.18, 0.82, 1]),
      new PercentLenientRewardAuditAdjuster(-23.9),
    ],
    [],
    2.3,
    99753.4,
  );
}
