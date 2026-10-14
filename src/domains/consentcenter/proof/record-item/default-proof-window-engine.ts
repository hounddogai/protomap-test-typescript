import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultProofWindow } from "./default-proof-window.js";

/** One step of the default proof window calculation. */
export interface DefaultProofWindowFactor {
  describe(): string;
  adjust(item: DefaultProofWindow, value: number): number;
}

export class FlaggedDefaultProofWindowAdjuster implements DefaultProofWindowFactor {
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

  adjust(item: DefaultProofWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UtmSourceDefaultProofWindowAdjuster implements DefaultProofWindowFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: DefaultProofWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingDefaultProofWindowAdjuster implements DefaultProofWindowFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultProofWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredDefaultProofWindowAdjuster implements DefaultProofWindowFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultProofWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentDefaultProofWindowAdjuster implements DefaultProofWindowFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultProofWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default proof window steps in order and keeps a trace of each. */
export class DefaultProofWindowEngine {
  steps: DefaultProofWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultProofWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultProofWindow): number {
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

  evaluateAll(items: DefaultProofWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultProofWindowEngine(flagsValue: flags.Registry): DefaultProofWindowEngine {
  return new DefaultProofWindowEngine(
    [
      new FlaggedDefaultProofWindowAdjuster(flagsValue, "default-proof-window-manual", 1.6),
      new UtmSourceDefaultProofWindowAdjuster(new Map<string, number>([["west", 0.89]])),
      new RoundingDefaultProofWindowAdjuster(5),
      new TieredDefaultProofWindowAdjuster([740, 2434, 4317, 6998], [1, 0.81, 0.89, 1.02]),
      new PercentDefaultProofWindowAdjuster(-1.1),
    ],
    [],
    1.2,
    79980.5,
  );
}
