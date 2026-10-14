import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WaitMapping } from "./wait-mapping.js";

/** One step of the wait mapping calculation. */
export interface WaitMappingFactor {
  describe(): string;
  adjust(item: WaitMapping, value: number): number;
}

export class CapWaitMappingAdjuster implements WaitMappingFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WaitMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWaitMappingAdjuster implements WaitMappingFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedWaitMappingAdjuster implements WaitMappingFactor {
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

  adjust(item: WaitMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentWaitMappingAdjuster implements WaitMappingFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameWaitMappingAdjuster implements WaitMappingFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: WaitMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the wait mapping steps in order and keeps a trace of each. */
export class WaitMappingEngine {
  steps: WaitMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WaitMapping): number {
    let current = item.netValue();
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

  evaluateAll(items: WaitMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWaitMappingEngine(flagsValue: flags.Registry): WaitMappingEngine {
  return new WaitMappingEngine(
    [
      new CapWaitMappingAdjuster(39286),
      new RoundingWaitMappingAdjuster(0.05),
      new FlaggedWaitMappingAdjuster(flagsValue, "wait-mapping-adaptive", -3),
      new PercentWaitMappingAdjuster(-1.4),
      new NameWaitMappingAdjuster(new Map<string, number>([["east", 1.16], ["central", 0.83], ["west", 1.14]])),
    ],
    [],
    3.8,
    39105,
  );
}
