import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { EscalationPreference } from "./escalation-preference.js";

/** One step of the escalation preference calculation. */
export interface EscalationPreferenceStep {
  describe(): string;
  adjust(item: EscalationPreference, value: number): number;
}

export class PercentEscalationPreferenceAdjuster implements EscalationPreferenceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EscalationPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingEscalationPreferenceAdjuster implements EscalationPreferenceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EscalationPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapEscalationPreferenceAdjuster implements EscalationPreferenceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EscalationPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredEscalationPreferenceAdjuster implements EscalationPreferenceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EscalationPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedEscalationPreferenceAdjuster implements EscalationPreferenceStep {
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

  adjust(item: EscalationPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the escalation preference steps in order and keeps a trace of each. */
export class EscalationPreferenceEngine {
  steps: EscalationPreferenceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationPreferenceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: EscalationPreference): number {
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

  evaluateAll(items: EscalationPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultEscalationPreferenceEngine(flagsValue: flags.Registry): EscalationPreferenceEngine {
  return new EscalationPreferenceEngine(
    [
      new PercentEscalationPreferenceAdjuster(-2.3),
      new RoundingEscalationPreferenceAdjuster(0.05),
      new CapEscalationPreferenceAdjuster(43024),
      new TieredEscalationPreferenceAdjuster([968, 2951], [1.15, 1.08]),
      new FlaggedEscalationPreferenceAdjuster(flagsValue, "escalation-preference-scheduled", -0),
    ],
    [],
    4.9,
    6777.4,
  );
}
