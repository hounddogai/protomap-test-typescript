import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictExitRuleCycle } from "./strict-exit-rule-cycle.js";

/** One step of the strict exit rule cycle calculation. */
export interface StrictExitRuleCycleAdjuster {
  describe(): string;
  adjust(item: StrictExitRuleCycle, value: number): number;
}

export class PercentStrictExitRuleCycleAdjuster implements StrictExitRuleCycleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictExitRuleCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingStrictExitRuleCycleAdjuster implements StrictExitRuleCycleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictExitRuleCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumStrictExitRuleCycleAdjuster implements StrictExitRuleCycleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictExitRuleCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameStrictExitRuleCycleAdjuster implements StrictExitRuleCycleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: StrictExitRuleCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapStrictExitRuleCycleAdjuster implements StrictExitRuleCycleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictExitRuleCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedStrictExitRuleCycleAdjuster implements StrictExitRuleCycleAdjuster {
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

  adjust(item: StrictExitRuleCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict exit rule cycle steps in order and keeps a trace of each. */
export class StrictExitRuleCycleEngine {
  steps: StrictExitRuleCycleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictExitRuleCycleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictExitRuleCycle): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: StrictExitRuleCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictExitRuleCycleEngine(flagsValue: flags.Registry): StrictExitRuleCycleEngine {
  return new StrictExitRuleCycleEngine(
    [
      new PercentStrictExitRuleCycleAdjuster(6.5),
      new RoundingStrictExitRuleCycleAdjuster(0.25),
      new MinimumStrictExitRuleCycleAdjuster(3.7),
      new NameStrictExitRuleCycleAdjuster(new Map<string, number>([["south", 1.11]])),
      new CapStrictExitRuleCycleAdjuster(34233),
      new FlaggedStrictExitRuleCycleAdjuster(flagsValue, "strict-exit-rule-cycle-fallback", 9.6),
    ],
    [],
    1.2,
    35333.3,
  );
}
