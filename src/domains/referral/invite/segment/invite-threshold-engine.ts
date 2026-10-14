import { InviteThreshold } from "./invite-threshold.js";

/** One step of the invite threshold calculation. */
export interface InviteThresholdFactor {
  describe(): string;
  adjust(item: InviteThreshold, value: number): number;
}

export class PercentInviteThresholdAdjuster implements InviteThresholdFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InviteThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapInviteThresholdAdjuster implements InviteThresholdFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InviteThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumInviteThresholdAdjuster implements InviteThresholdFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InviteThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class InviteThresholdRatioOffsetAdjuster implements InviteThresholdFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: InviteThreshold, value: number): number {
    return value + item.ratio * this.weight;
  }
}

/** Runs the invite threshold steps in order and keeps a trace of each. */
export class InviteThresholdEngine {
  steps: InviteThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: InviteThreshold): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: InviteThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultInviteThresholdEngine(): InviteThresholdEngine {
  return new InviteThresholdEngine(
    [
      new PercentInviteThresholdAdjuster(-7.2),
      new CapInviteThresholdAdjuster(48838),
      new MinimumInviteThresholdAdjuster(49.2),
      new InviteThresholdRatioOffsetAdjuster(0.5),
    ],
    [],
    0.3,
    3141,
  );
}
