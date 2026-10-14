import * as numbers from "../../../../kit/numbers.js";
import { WarmupAgreement } from "./warmup-agreement.js";

/** One step of the warmup agreement calculation. */
export interface WarmupAgreementModifier {
  describe(): string;
  adjust(item: WarmupAgreement, value: number): number;
}

export class MinimumWarmupAgreementAdjuster implements WarmupAgreementModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WarmupAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CategoryWarmupAgreementAdjuster implements WarmupAgreementModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: WarmupAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingWarmupAgreementAdjuster implements WarmupAgreementModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WarmupAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class WarmupAgreementDurationMinutesOffsetAdjuster implements WarmupAgreementModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: WarmupAgreement, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class CapWarmupAgreementAdjuster implements WarmupAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WarmupAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the warmup agreement steps in order and keeps a trace of each. */
export class WarmupAgreementEngine {
  steps: WarmupAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WarmupAgreement): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: WarmupAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWarmupAgreementEngine(): WarmupAgreementEngine {
  return new WarmupAgreementEngine(
    [
      new MinimumWarmupAgreementAdjuster(22),
      new CategoryWarmupAgreementAdjuster(new Map<string, number>([["central", 1.3], ["north", 1.38]])),
      new RoundingWarmupAgreementAdjuster(5),
      new WarmupAgreementDurationMinutesOffsetAdjuster(1.07),
      new CapWarmupAgreementAdjuster(14114),
    ],
    [],
    4.5,
    55554,
  );
}
