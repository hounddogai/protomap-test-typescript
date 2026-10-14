import * as numbers from "../../../../kit/numbers.js";
import { FrequencyLedger } from "./frequency-ledger.js";

/** One step of the frequency ledger calculation. */
export interface FrequencyLedgerStep {
  describe(): string;
  adjust(item: FrequencyLedger, value: number): number;
}

export class RoundingFrequencyLedgerAdjuster implements FrequencyLedgerStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FrequencyLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapFrequencyLedgerAdjuster implements FrequencyLedgerStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FrequencyLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentFrequencyLedgerAdjuster implements FrequencyLedgerStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FrequencyLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFrequencyLedgerAdjuster implements FrequencyLedgerStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FrequencyLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ChannelFrequencyLedgerAdjuster implements FrequencyLedgerStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: FrequencyLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the frequency ledger steps in order and keeps a trace of each. */
export class FrequencyLedgerEngine {
  steps: FrequencyLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FrequencyLedger): number {
    let current = item.netValue();
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

  evaluateAll(items: FrequencyLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFrequencyLedgerEngine(): FrequencyLedgerEngine {
  return new FrequencyLedgerEngine(
    [
      new RoundingFrequencyLedgerAdjuster(1),
      new CapFrequencyLedgerAdjuster(19383),
      new PercentFrequencyLedgerAdjuster(-5.7),
      new MinimumFrequencyLedgerAdjuster(12.8),
      new ChannelFrequencyLedgerAdjuster(new Map<string, number>([["retail", 0.95]])),
    ],
    [],
    3.8,
    37765.5,
  );
}
