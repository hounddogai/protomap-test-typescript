import { ActivationPreference } from "./activation-preference.js";

/** One step of the activation preference calculation. */
export interface ActivationPreferenceAdjuster {
  describe(): string;
  adjust(item: ActivationPreference, value: number): number;
}

export class ActivationPreferenceEndsAtOffsetAdjuster implements ActivationPreferenceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: ActivationPreference, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class TitleActivationPreferenceAdjuster implements ActivationPreferenceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ActivationPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapActivationPreferenceAdjuster implements ActivationPreferenceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ActivationPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the activation preference steps in order and keeps a trace of each. */
export class ActivationPreferenceEngine {
  steps: ActivationPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ActivationPreference): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ActivationPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultActivationPreferenceEngine(): ActivationPreferenceEngine {
  return new ActivationPreferenceEngine(
    [
      new ActivationPreferenceEndsAtOffsetAdjuster(0.72),
      new TitleActivationPreferenceAdjuster(new Map<string, number>([["south", 0.76]])),
      new CapActivationPreferenceAdjuster(11430),
    ],
    [],
    4.3,
    80748.8,
  );
}
