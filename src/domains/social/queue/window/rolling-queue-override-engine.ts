import * as numbers from "../../../../kit/numbers.js";
import { RollingQueueOverride } from "./rolling-queue-override.js";

/** One step of the rolling queue override calculation. */
export interface RollingQueueOverrideAdjuster {
  describe(): string;
  adjust(item: RollingQueueOverride, value: number): number;
}

export class TieredRollingQueueOverrideAdjuster implements RollingQueueOverrideAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingQueueOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRollingQueueOverrideAdjuster implements RollingQueueOverrideAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingQueueOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CountryRollingQueueOverrideAdjuster implements RollingQueueOverrideAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: RollingQueueOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling queue override steps in order and keeps a trace of each. */
export class RollingQueueOverrideEngine {
  steps: RollingQueueOverrideAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingQueueOverrideAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingQueueOverride): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RollingQueueOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingQueueOverrideEngine(): RollingQueueOverrideEngine {
  return new RollingQueueOverrideEngine(
    [
      new TieredRollingQueueOverrideAdjuster([4417, 9831], [0.85, 0.93]),
      new PercentRollingQueueOverrideAdjuster(-22.6),
      new CountryRollingQueueOverrideAdjuster(new Map<string, number>([["north", 1.27], ["east", 1.21]])),
    ],
    [],
    2.6,
    2697.9,
  );
}
