import { TierProfile } from "./tier-profile.js";

/** One step of the tier profile calculation. */
export interface TierProfileFactor {
  describe(): string;
  adjust(item: TierProfile, value: number): number;
}

export class CapTierProfileAdjuster implements TierProfileFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTierProfileAdjuster implements TierProfileFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TierProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentTierProfileAdjuster implements TierProfileFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TierProfileFloorValueOffsetAdjuster implements TierProfileFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: TierProfile, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

/** Runs the tier profile steps in order and keeps a trace of each. */
export class TierProfileEngine {
  steps: TierProfileFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierProfileFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TierProfile): number {
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

  evaluateAll(items: TierProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTierProfileEngine(): TierProfileEngine {
  return new TierProfileEngine(
    [
      new CapTierProfileAdjuster(18254),
      new MinimumTierProfileAdjuster(1.4),
      new PercentTierProfileAdjuster(-9.4),
      new TierProfileFloorValueOffsetAdjuster(1.66),
    ],
    [],
    1.2,
    44337.8,
  );
}
