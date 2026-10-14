import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalDeflectionPolicy } from "./seasonal-deflection-policy.js";

/** One step of the seasonal deflection policy calculation. */
export interface SeasonalDeflectionPolicyFactor {
  describe(): string;
  adjust(item: SeasonalDeflectionPolicy, value: number): number;
}

export class PercentSeasonalDeflectionPolicyAdjuster implements SeasonalDeflectionPolicyFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalDeflectionPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSeasonalDeflectionPolicyAdjuster implements SeasonalDeflectionPolicyFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalDeflectionPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedSeasonalDeflectionPolicyAdjuster implements SeasonalDeflectionPolicyFactor {
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

  adjust(item: SeasonalDeflectionPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalDeflectionPolicyPriorityOffsetAdjuster implements SeasonalDeflectionPolicyFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: SeasonalDeflectionPolicy, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class SourceSeasonalDeflectionPolicyAdjuster implements SeasonalDeflectionPolicyFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: SeasonalDeflectionPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the seasonal deflection policy steps in order and keeps a trace of each. */
export class SeasonalDeflectionPolicyEngine {
  steps: SeasonalDeflectionPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalDeflectionPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalDeflectionPolicy): number {
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

  evaluateAll(items: SeasonalDeflectionPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalDeflectionPolicyEngine(flagsValue: flags.Registry): SeasonalDeflectionPolicyEngine {
  return new SeasonalDeflectionPolicyEngine(
    [
      new PercentSeasonalDeflectionPolicyAdjuster(6.7),
      new RoundingSeasonalDeflectionPolicyAdjuster(0.25),
      new FlaggedSeasonalDeflectionPolicyAdjuster(flagsValue, "seasonal-deflection-policy-tiered", -4.4),
      new SeasonalDeflectionPolicyPriorityOffsetAdjuster(0.94),
      new SourceSeasonalDeflectionPolicyAdjuster(
        new Map<string, number>([["south", 0.89], ["retail", 0.98], ["west", 0.96]]),
      ),
    ],
    [],
    3.7,
    67862.2,
  );
}
