import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackReputationVariance } from "./fallback-reputation-variance.js";

/** One step of the fallback reputation variance calculation. */
export interface FallbackReputationVarianceModifier {
  describe(): string;
  adjust(item: FallbackReputationVariance, value: number): number;
}

export class RoundingFallbackReputationVarianceAdjuster implements FallbackReputationVarianceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackReputationVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedFallbackReputationVarianceAdjuster implements FallbackReputationVarianceModifier {
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

  adjust(item: FallbackReputationVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentFallbackReputationVarianceAdjuster implements FallbackReputationVarianceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackReputationVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapFallbackReputationVarianceAdjuster implements FallbackReputationVarianceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackReputationVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelFallbackReputationVarianceAdjuster implements FallbackReputationVarianceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FallbackReputationVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the fallback reputation variance steps in order and keeps a trace of each. */
export class FallbackReputationVarianceEngine {
  steps: FallbackReputationVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackReputationVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackReputationVariance): number {
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

  evaluateAll(items: FallbackReputationVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackReputationVarianceEngine(flagsValue: flags.Registry): FallbackReputationVarianceEngine {
  return new FallbackReputationVarianceEngine(
    [
      new RoundingFallbackReputationVarianceAdjuster(5),
      new FlaggedFallbackReputationVarianceAdjuster(flagsValue, "fallback-reputation-variance-lenient", 6.8),
      new PercentFallbackReputationVarianceAdjuster(-7.7),
      new CapFallbackReputationVarianceAdjuster(44913),
      new LabelFallbackReputationVarianceAdjuster(
        new Map<string, number>([["online", 1.15], ["central", 1.25], ["retail", 1.11]]),
      ),
    ],
    [],
    1.8,
    48443.1,
  );
}
