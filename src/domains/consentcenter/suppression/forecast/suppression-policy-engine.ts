import * as flags from "../../../../kit/flags.js";
import { SuppressionPolicy } from "./suppression-policy.js";

/** One step of the suppression policy calculation. */
export interface SuppressionPolicyModifier {
  describe(): string;
  adjust(item: SuppressionPolicy, value: number): number;
}

export class MinimumSuppressionPolicyAdjuster implements SuppressionPolicyModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SuppressionPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentSuppressionPolicyAdjuster implements SuppressionPolicyModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SuppressionPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedSuppressionPolicyAdjuster implements SuppressionPolicyModifier {
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

  adjust(item: SuppressionPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the suppression policy steps in order and keeps a trace of each. */
export class SuppressionPolicyEngine {
  steps: SuppressionPolicyModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionPolicyModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SuppressionPolicy): number {
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

  evaluateAll(items: SuppressionPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSuppressionPolicyEngine(flagsValue: flags.Registry): SuppressionPolicyEngine {
  return new SuppressionPolicyEngine(
    [
      new MinimumSuppressionPolicyAdjuster(0.9),
      new PercentSuppressionPolicyAdjuster(10.9),
      new FlaggedSuppressionPolicyAdjuster(flagsValue, "suppression-policy-strict", -3),
    ],
    [],
    2.6,
    43955.5,
  );
}
