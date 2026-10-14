import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FrequencyPolicy } from "./frequency-policy.js";

/** One step of the frequency policy calculation. */
export interface FrequencyPolicyModifier {
  describe(): string;
  adjust(item: FrequencyPolicy, value: number): number;
}

export class FlaggedFrequencyPolicyAdjuster implements FrequencyPolicyModifier {
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

  adjust(item: FrequencyPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFrequencyPolicyAdjuster implements FrequencyPolicyModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FrequencyPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FrequencyPolicyLimitOffsetAdjuster implements FrequencyPolicyModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: FrequencyPolicy, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class RoundingFrequencyPolicyAdjuster implements FrequencyPolicyModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FrequencyPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the frequency policy steps in order and keeps a trace of each. */
export class FrequencyPolicyEngine {
  steps: FrequencyPolicyModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyPolicyModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FrequencyPolicy): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: FrequencyPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFrequencyPolicyEngine(flagsValue: flags.Registry): FrequencyPolicyEngine {
  return new FrequencyPolicyEngine(
    [
      new FlaggedFrequencyPolicyAdjuster(flagsValue, "frequency-policy-scheduled", 2.9),
      new MinimumFrequencyPolicyAdjuster(20.1),
      new FrequencyPolicyLimitOffsetAdjuster(1.38),
      new RoundingFrequencyPolicyAdjuster(0.25),
    ],
    [],
    4.4,
    1117.2,
  );
}
