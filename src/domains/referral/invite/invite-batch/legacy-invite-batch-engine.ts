import * as numbers from "../../../../kit/numbers.js";
import { LegacyInviteBatch } from "./legacy-invite-batch.js";

/** One step of the legacy invite batch calculation. */
export interface LegacyInviteBatchFactor {
  describe(): string;
  adjust(item: LegacyInviteBatch, value: number): number;
}

export class RegionLegacyInviteBatchAdjuster implements LegacyInviteBatchFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: LegacyInviteBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLegacyInviteBatchAdjuster implements LegacyInviteBatchFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyInviteBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLegacyInviteBatchAdjuster implements LegacyInviteBatchFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyInviteBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LegacyInviteBatchClicksOffsetAdjuster implements LegacyInviteBatchFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: LegacyInviteBatch, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class RoundingLegacyInviteBatchAdjuster implements LegacyInviteBatchFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyInviteBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapLegacyInviteBatchAdjuster implements LegacyInviteBatchFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyInviteBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the legacy invite batch steps in order and keeps a trace of each. */
export class LegacyInviteBatchEngine {
  steps: LegacyInviteBatchFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyInviteBatchFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyInviteBatch): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: LegacyInviteBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyInviteBatchEngine(): LegacyInviteBatchEngine {
  return new LegacyInviteBatchEngine(
    [
      new RegionLegacyInviteBatchAdjuster(
        new Map<string, number>([["retail", 1.23], ["west", 1.12], ["east", 1.11]]),
      ),
      new PercentLegacyInviteBatchAdjuster(19.8),
      new MinimumLegacyInviteBatchAdjuster(22.2),
      new LegacyInviteBatchClicksOffsetAdjuster(0.76),
      new RoundingLegacyInviteBatchAdjuster(0.05),
      new CapLegacyInviteBatchAdjuster(35933),
    ],
    [],
    2.8,
    52254.5,
  );
}
