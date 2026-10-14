import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BounceMapping } from "./bounce-mapping.js";

/** One step of the bounce mapping calculation. */
export interface BounceMappingAdjuster {
  describe(): string;
  adjust(item: BounceMapping, value: number): number;
}

export class PercentBounceMappingAdjuster implements BounceMappingAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BounceMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapBounceMappingAdjuster implements BounceMappingAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BounceMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameBounceMappingAdjuster implements BounceMappingAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: BounceMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedBounceMappingAdjuster implements BounceMappingAdjuster {
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

  adjust(item: BounceMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the bounce mapping steps in order and keeps a trace of each. */
export class BounceMappingEngine {
  steps: BounceMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BounceMapping): number {
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

  evaluateAll(items: BounceMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBounceMappingEngine(flagsValue: flags.Registry): BounceMappingEngine {
  return new BounceMappingEngine(
    [
      new PercentBounceMappingAdjuster(3.9),
      new CapBounceMappingAdjuster(7544),
      new NameBounceMappingAdjuster(new Map<string, number>([["online", 0.99], ["retail", 1.32]])),
      new FlaggedBounceMappingAdjuster(flagsValue, "bounce-mapping-tiered", 5.9),
    ],
    [],
    1.9,
    73028.7,
  );
}
