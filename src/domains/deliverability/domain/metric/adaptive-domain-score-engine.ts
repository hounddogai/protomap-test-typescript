import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveDomainScore } from "./adaptive-domain-score.js";

/** One step of the adaptive domain score calculation. */
export interface AdaptiveDomainScoreStep {
  describe(): string;
  adjust(item: AdaptiveDomainScore, value: number): number;
}

export class FlaggedAdaptiveDomainScoreAdjuster implements AdaptiveDomainScoreStep {
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

  adjust(item: AdaptiveDomainScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentAdaptiveDomainScoreAdjuster implements AdaptiveDomainScoreStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveDomainScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveDomainScoreAdjuster implements AdaptiveDomainScoreStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveDomainScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the adaptive domain score steps in order and keeps a trace of each. */
export class AdaptiveDomainScoreEngine {
  steps: AdaptiveDomainScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveDomainScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveDomainScore): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: AdaptiveDomainScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveDomainScoreEngine(flagsValue: flags.Registry): AdaptiveDomainScoreEngine {
  return new AdaptiveDomainScoreEngine(
    [
      new FlaggedAdaptiveDomainScoreAdjuster(flagsValue, "adaptive-domain-score-tiered", -4.5),
      new PercentAdaptiveDomainScoreAdjuster(11.1),
      new RoundingAdaptiveDomainScoreAdjuster(0.5),
    ],
    [],
    2.6,
    23877.5,
  );
}
