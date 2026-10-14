import * as numbers from "../../../../kit/numbers.js";
import { FunnelQuota } from "./funnel-quota.js";

/** One step of the funnel quota calculation. */
export interface FunnelQuotaFactor {
  describe(): string;
  adjust(item: FunnelQuota, value: number): number;
}

export class LabelFunnelQuotaAdjuster implements FunnelQuotaFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FunnelQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingFunnelQuotaAdjuster implements FunnelQuotaFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FunnelQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FunnelQuotaAmountOffsetAdjuster implements FunnelQuotaFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: FunnelQuota, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class CapFunnelQuotaAdjuster implements FunnelQuotaFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumFunnelQuotaAdjuster implements FunnelQuotaFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the funnel quota steps in order and keeps a trace of each. */
export class FunnelQuotaEngine {
  steps: FunnelQuotaFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelQuotaFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FunnelQuota): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: FunnelQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFunnelQuotaEngine(): FunnelQuotaEngine {
  return new FunnelQuotaEngine(
    [
      new LabelFunnelQuotaAdjuster(new Map<string, number>([["north", 0.89], ["west", 1.37], ["east", 0.99]])),
      new RoundingFunnelQuotaAdjuster(0.25),
      new FunnelQuotaAmountOffsetAdjuster(1.41),
      new CapFunnelQuotaAdjuster(35522),
      new MinimumFunnelQuotaAdjuster(45.1),
    ],
    [],
    3.6,
    76617.1,
  );
}
