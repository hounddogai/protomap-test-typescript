import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictExitRuleDraft } from "./strict-exit-rule-draft.js";

/** One step of the strict exit rule draft calculation. */
export interface StrictExitRuleDraftStep {
  describe(): string;
  adjust(item: StrictExitRuleDraft, value: number): number;
}

export class FlaggedStrictExitRuleDraftAdjuster implements StrictExitRuleDraftStep {
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

  adjust(item: StrictExitRuleDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictExitRuleDraftAdjuster implements StrictExitRuleDraftStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictExitRuleDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentStrictExitRuleDraftAdjuster implements StrictExitRuleDraftStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictExitRuleDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredStrictExitRuleDraftAdjuster implements StrictExitRuleDraftStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictExitRuleDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the strict exit rule draft steps in order and keeps a trace of each. */
export class StrictExitRuleDraftEngine {
  steps: StrictExitRuleDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictExitRuleDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictExitRuleDraft): number {
    let current = item.netVolume();
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

  evaluateAll(items: StrictExitRuleDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictExitRuleDraftEngine(flagsValue: flags.Registry): StrictExitRuleDraftEngine {
  return new StrictExitRuleDraftEngine(
    [
      new FlaggedStrictExitRuleDraftAdjuster(flagsValue, "strict-exit-rule-draft-default", -6.9),
      new MinimumStrictExitRuleDraftAdjuster(1.4),
      new PercentStrictExitRuleDraftAdjuster(-8),
      new TieredStrictExitRuleDraftAdjuster([60, 1478, 2133], [0.91, 0.87, 0.84]),
    ],
    [],
    0.6,
    26172.3,
  );
}
