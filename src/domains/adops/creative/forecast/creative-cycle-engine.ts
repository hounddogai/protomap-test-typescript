import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreativeCycle } from "./creative-cycle.js";

/** One step of the creative cycle calculation. */
export interface CreativeCycleModifier {
  describe(): string;
  adjust(item: CreativeCycle, value: number): number;
}

export class CapCreativeCycleAdjuster implements CreativeCycleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreativeCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentCreativeCycleAdjuster implements CreativeCycleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreativeCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedCreativeCycleAdjuster implements CreativeCycleModifier {
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

  adjust(item: CreativeCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCreativeCycleAdjuster implements CreativeCycleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CategoryCreativeCycleAdjuster implements CreativeCycleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: CreativeCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the creative cycle steps in order and keeps a trace of each. */
export class CreativeCycleEngine {
  steps: CreativeCycleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeCycleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CreativeCycle): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: CreativeCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCreativeCycleEngine(flagsValue: flags.Registry): CreativeCycleEngine {
  return new CreativeCycleEngine(
    [
      new CapCreativeCycleAdjuster(44256),
      new PercentCreativeCycleAdjuster(1.4),
      new FlaggedCreativeCycleAdjuster(flagsValue, "creative-cycle-strict", -7.6),
      new RoundingCreativeCycleAdjuster(0.5),
      new CategoryCreativeCycleAdjuster(
        new Map<string, number>([["north", 1.1], ["west", 1.36], ["south", 0.93]]),
      ),
    ],
    [],
    0.2,
    36156.8,
  );
}
