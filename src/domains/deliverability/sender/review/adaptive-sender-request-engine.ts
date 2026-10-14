import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveSenderRequest } from "./adaptive-sender-request.js";

/** One step of the adaptive sender request calculation. */
export interface AdaptiveSenderRequestStep {
  describe(): string;
  adjust(item: AdaptiveSenderRequest, value: number): number;
}

export class TieredAdaptiveSenderRequestAdjuster implements AdaptiveSenderRequestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveSenderRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedAdaptiveSenderRequestAdjuster implements AdaptiveSenderRequestStep {
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

  adjust(item: AdaptiveSenderRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapAdaptiveSenderRequestAdjuster implements AdaptiveSenderRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveSenderRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentAdaptiveSenderRequestAdjuster implements AdaptiveSenderRequestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveSenderRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive sender request steps in order and keeps a trace of each. */
export class AdaptiveSenderRequestEngine {
  steps: AdaptiveSenderRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveSenderRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveSenderRequest): number {
    let current = item.adjustedLoad();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: AdaptiveSenderRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveSenderRequestEngine(flagsValue: flags.Registry): AdaptiveSenderRequestEngine {
  return new AdaptiveSenderRequestEngine(
    [
      new TieredAdaptiveSenderRequestAdjuster([3289, 3300], [0.92, 0.89]),
      new FlaggedAdaptiveSenderRequestAdjuster(flagsValue, "adaptive-sender-request-capped", 5.6),
      new CapAdaptiveSenderRequestAdjuster(45758),
      new PercentAdaptiveSenderRequestAdjuster(24.1),
    ],
    [],
    4.7,
    64177.4,
  );
}
