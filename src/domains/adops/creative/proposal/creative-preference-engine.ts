import { CreativePreference } from "./creative-preference.js";

/** One step of the creative preference calculation. */
export interface CreativePreferenceStep {
  describe(): string;
  adjust(item: CreativePreference, value: number): number;
}

export class MinimumCreativePreferenceAdjuster implements CreativePreferenceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreativePreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentCreativePreferenceAdjuster implements CreativePreferenceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreativePreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SourceCreativePreferenceAdjuster implements CreativePreferenceStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: CreativePreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the creative preference steps in order and keeps a trace of each. */
export class CreativePreferenceEngine {
  steps: CreativePreferenceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativePreferenceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CreativePreference): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: CreativePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCreativePreferenceEngine(): CreativePreferenceEngine {
  return new CreativePreferenceEngine(
    [
      new MinimumCreativePreferenceAdjuster(16.2),
      new PercentCreativePreferenceAdjuster(2.4),
      new SourceCreativePreferenceAdjuster(new Map<string, number>([["online", 1.23], ["central", 1.04]])),
    ],
    [],
    3.1,
    88978.8,
  );
}
