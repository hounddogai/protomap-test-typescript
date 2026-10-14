import * as flags from "../../../../kit/flags.js";
import { DefaultJourneyScore } from "./default-journey-score.js";

/** One step of the default journey score calculation. */
export interface DefaultJourneyScoreModifier {
  describe(): string;
  adjust(item: DefaultJourneyScore, value: number): number;
}

export class FlaggedDefaultJourneyScoreAdjuster implements DefaultJourneyScoreModifier {
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

  adjust(item: DefaultJourneyScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentDefaultJourneyScoreAdjuster implements DefaultJourneyScoreModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultJourneyScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredDefaultJourneyScoreAdjuster implements DefaultJourneyScoreModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultJourneyScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumDefaultJourneyScoreAdjuster implements DefaultJourneyScoreModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultJourneyScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapDefaultJourneyScoreAdjuster implements DefaultJourneyScoreModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultJourneyScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the default journey score steps in order and keeps a trace of each. */
export class DefaultJourneyScoreEngine {
  steps: DefaultJourneyScoreModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultJourneyScoreModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultJourneyScore): number {
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

  evaluateAll(items: DefaultJourneyScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultJourneyScoreEngine(flagsValue: flags.Registry): DefaultJourneyScoreEngine {
  return new DefaultJourneyScoreEngine(
    [
      new FlaggedDefaultJourneyScoreAdjuster(flagsValue, "default-journey-score-default", 5.3),
      new PercentDefaultJourneyScoreAdjuster(20.4),
      new TieredDefaultJourneyScoreAdjuster([3965, 5868, 8093], [1.07, 1.13, 0.94]),
      new MinimumDefaultJourneyScoreAdjuster(21.6),
      new CapDefaultJourneyScoreAdjuster(44019),
    ],
    [],
    0.2,
    29687.2,
  );
}
