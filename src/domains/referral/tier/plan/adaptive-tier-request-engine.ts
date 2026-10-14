import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveTierRequest } from "./adaptive-tier-request.js";

/** One step of the adaptive tier request calculation. */
export interface AdaptiveTierRequestFactor {
  describe(): string;
  adjust(item: AdaptiveTierRequest, value: number): number;
}

export class MinimumAdaptiveTierRequestAdjuster implements AdaptiveTierRequestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveTierRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class AdaptiveTierRequestThresholdOffsetAdjuster implements AdaptiveTierRequestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: AdaptiveTierRequest, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class FlaggedAdaptiveTierRequestAdjuster implements AdaptiveTierRequestFactor {
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

  adjust(item: AdaptiveTierRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentAdaptiveTierRequestAdjuster implements AdaptiveTierRequestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveTierRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive tier request steps in order and keeps a trace of each. */
export class AdaptiveTierRequestEngine {
  steps: AdaptiveTierRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveTierRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveTierRequest): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: AdaptiveTierRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveTierRequestEngine(flagsValue: flags.Registry): AdaptiveTierRequestEngine {
  return new AdaptiveTierRequestEngine(
    [
      new MinimumAdaptiveTierRequestAdjuster(11.7),
      new AdaptiveTierRequestThresholdOffsetAdjuster(0.07),
      new FlaggedAdaptiveTierRequestAdjuster(flagsValue, "adaptive-tier-request-pending", 1.4),
      new PercentAdaptiveTierRequestAdjuster(-10),
    ],
    [],
    1.6,
    8569.4,
  );
}
