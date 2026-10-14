import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveInviteAdjustment } from "./adaptive-invite-adjustment.js";

/** One step of the adaptive invite adjustment calculation. */
export interface AdaptiveInviteAdjustmentAdjuster {
  describe(): string;
  adjust(item: AdaptiveInviteAdjustment, value: number): number;
}

export class CapAdaptiveInviteAdjustmentAdjuster implements AdaptiveInviteAdjustmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveInviteAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentAdaptiveInviteAdjustmentAdjuster implements AdaptiveInviteAdjustmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveInviteAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveInviteAdjustmentAdjuster implements AdaptiveInviteAdjustmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveInviteAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class AdaptiveInviteAdjustmentThresholdOffsetAdjuster implements AdaptiveInviteAdjustmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: AdaptiveInviteAdjustment, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class NameAdaptiveInviteAdjustmentAdjuster implements AdaptiveInviteAdjustmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: AdaptiveInviteAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the adaptive invite adjustment steps in order and keeps a trace of each. */
export class AdaptiveInviteAdjustmentEngine {
  steps: AdaptiveInviteAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveInviteAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveInviteAdjustment): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: AdaptiveInviteAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveInviteAdjustmentEngine(): AdaptiveInviteAdjustmentEngine {
  return new AdaptiveInviteAdjustmentEngine(
    [
      new CapAdaptiveInviteAdjustmentAdjuster(36498),
      new PercentAdaptiveInviteAdjustmentAdjuster(-19),
      new RoundingAdaptiveInviteAdjustmentAdjuster(0.1),
      new AdaptiveInviteAdjustmentThresholdOffsetAdjuster(0.53),
      new NameAdaptiveInviteAdjustmentAdjuster(new Map<string, number>([["online", 1.15]])),
    ],
    [],
    2.5,
    92127,
  );
}
