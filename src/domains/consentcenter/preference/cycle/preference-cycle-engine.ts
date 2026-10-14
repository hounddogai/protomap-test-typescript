import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PreferenceCycle } from "./preference-cycle.js";

/** One step of the preference cycle calculation. */
export interface PreferenceCycleModifier {
  describe(): string;
  adjust(item: PreferenceCycle, value: number): number;
}

export class FlaggedPreferenceCycleAdjuster implements PreferenceCycleModifier {
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

  adjust(item: PreferenceCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPreferenceCycleAdjuster implements PreferenceCycleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PreferenceCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPreferenceCycleAdjuster implements PreferenceCycleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PreferenceCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NamePreferenceCycleAdjuster implements PreferenceCycleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PreferenceCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPreferenceCycleAdjuster implements PreferenceCycleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PreferenceCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the preference cycle steps in order and keeps a trace of each. */
export class PreferenceCycleEngine {
  steps: PreferenceCycleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceCycleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PreferenceCycle): number {
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

  evaluateAll(items: PreferenceCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPreferenceCycleEngine(flagsValue: flags.Registry): PreferenceCycleEngine {
  return new PreferenceCycleEngine(
    [
      new FlaggedPreferenceCycleAdjuster(flagsValue, "preference-cycle-scheduled", -3.2),
      new PercentPreferenceCycleAdjuster(-2.7),
      new RoundingPreferenceCycleAdjuster(5),
      new NamePreferenceCycleAdjuster(new Map<string, number>([["east", 0.7]])),
      new CapPreferenceCycleAdjuster(15541),
    ],
    [],
    2.4,
    38519.3,
  );
}
