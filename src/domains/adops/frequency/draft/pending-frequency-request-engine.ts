import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingFrequencyRequest } from "./pending-frequency-request.js";

/** One step of the pending frequency request calculation. */
export interface PendingFrequencyRequestFactor {
  describe(): string;
  adjust(item: PendingFrequencyRequest, value: number): number;
}

export class FlaggedPendingFrequencyRequestAdjuster implements PendingFrequencyRequestFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: PendingFrequencyRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPendingFrequencyRequestAdjuster implements PendingFrequencyRequestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingFrequencyRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PendingFrequencyRequestEndsAtOffsetAdjuster implements PendingFrequencyRequestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: PendingFrequencyRequest, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class PercentPendingFrequencyRequestAdjuster implements PendingFrequencyRequestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingFrequencyRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingFrequencyRequestAdjuster implements PendingFrequencyRequestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingFrequencyRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPendingFrequencyRequestAdjuster implements PendingFrequencyRequestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingFrequencyRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the pending frequency request steps in order and keeps a trace of each. */
export class PendingFrequencyRequestEngine {
  steps: PendingFrequencyRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingFrequencyRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingFrequencyRequest): number {
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

  evaluateAll(items: PendingFrequencyRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingFrequencyRequestEngine(flagsValue: flags.Registry): PendingFrequencyRequestEngine {
  return new PendingFrequencyRequestEngine(
    [
      new FlaggedPendingFrequencyRequestAdjuster(flagsValue, "pending-frequency-request-primary", 0.9),
      new RoundingPendingFrequencyRequestAdjuster(0.05),
      new PendingFrequencyRequestEndsAtOffsetAdjuster(0.01),
      new PercentPendingFrequencyRequestAdjuster(2),
      new CapPendingFrequencyRequestAdjuster(2441),
      new TieredPendingFrequencyRequestAdjuster([6545, 6933], [0.96, 1.02]),
    ],
    [],
    4.1,
    44020.2,
  );
}
