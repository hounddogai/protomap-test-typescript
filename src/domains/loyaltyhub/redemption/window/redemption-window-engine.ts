import { RedemptionWindow } from "./redemption-window.js";

/** One step of the redemption window calculation. */
export interface RedemptionWindowModifier {
  describe(): string;
  adjust(item: RedemptionWindow, value: number): number;
}

export class TieredRedemptionWindowAdjuster implements RedemptionWindowModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RedemptionWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRedemptionWindowAdjuster implements RedemptionWindowModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRedemptionWindowAdjuster implements RedemptionWindowModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RedemptionWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the redemption window steps in order and keeps a trace of each. */
export class RedemptionWindowEngine {
  steps: RedemptionWindowModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionWindowModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RedemptionWindow): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: RedemptionWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRedemptionWindowEngine(): RedemptionWindowEngine {
  return new RedemptionWindowEngine(
    [
      new TieredRedemptionWindowAdjuster([2448, 7833], [0.87, 0.93]),
      new CapRedemptionWindowAdjuster(38289),
      new MinimumRedemptionWindowAdjuster(20.3),
    ],
    [],
    1.4,
    93388.8,
  );
}
