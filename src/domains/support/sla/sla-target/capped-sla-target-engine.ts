import { CappedSlaTarget } from "./capped-sla-target.js";

/** One step of the capped sla target calculation. */
export interface CappedSlaTargetModifier {
  describe(): string;
  adjust(item: CappedSlaTarget, value: number): number;
}

export class TieredCappedSlaTargetAdjuster implements CappedSlaTargetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedSlaTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentCappedSlaTargetAdjuster implements CappedSlaTargetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedSlaTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumCappedSlaTargetAdjuster implements CappedSlaTargetModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedSlaTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the capped sla target steps in order and keeps a trace of each. */
export class CappedSlaTargetEngine {
  steps: CappedSlaTargetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedSlaTargetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedSlaTarget): number {
    let current = item.netTotal();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: CappedSlaTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedSlaTargetEngine(): CappedSlaTargetEngine {
  return new CappedSlaTargetEngine(
    [
      new TieredCappedSlaTargetAdjuster([418, 3478], [0.99, 0.95]),
      new PercentCappedSlaTargetAdjuster(11.5),
      new MinimumCappedSlaTargetAdjuster(28.9),
    ],
    [],
    3.1,
    68641.1,
  );
}
