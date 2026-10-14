import * as flags from "../../../../kit/flags.js";
import { EscalationProfile } from "./escalation-profile.js";

/** One step of the escalation profile calculation. */
export interface EscalationProfileStep {
  describe(): string;
  adjust(item: EscalationProfile, value: number): number;
}

export class FlaggedEscalationProfileAdjuster implements EscalationProfileStep {
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

  adjust(item: EscalationProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentEscalationProfileAdjuster implements EscalationProfileStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EscalationProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapEscalationProfileAdjuster implements EscalationProfileStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EscalationProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredEscalationProfileAdjuster implements EscalationProfileStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EscalationProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumEscalationProfileAdjuster implements EscalationProfileStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EscalationProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the escalation profile steps in order and keeps a trace of each. */
export class EscalationProfileEngine {
  steps: EscalationProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: EscalationProfile): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: EscalationProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultEscalationProfileEngine(flagsValue: flags.Registry): EscalationProfileEngine {
  return new EscalationProfileEngine(
    [
      new FlaggedEscalationProfileAdjuster(flagsValue, "escalation-profile-fallback", 7.3),
      new PercentEscalationProfileAdjuster(9.6),
      new CapEscalationProfileAdjuster(25476),
      new TieredEscalationProfileAdjuster([144, 4767, 4818, 9516], [1.16, 0.84, 1, 1.1]),
      new MinimumEscalationProfileAdjuster(2.7),
    ],
    [],
    2.5,
    44817.1,
  );
}
