import * as flags from "../../../../kit/flags.js";
import { CappedWindowRequest } from "./capped-window-request.js";

/** One step of the capped window request calculation. */
export interface CappedWindowRequestModifier {
  describe(): string;
  adjust(item: CappedWindowRequest, value: number): number;
}

export class FlaggedCappedWindowRequestAdjuster implements CappedWindowRequestModifier {
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

  adjust(item: CappedWindowRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCappedWindowRequestAdjuster implements CappedWindowRequestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedWindowRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapCappedWindowRequestAdjuster implements CappedWindowRequestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedWindowRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredCappedWindowRequestAdjuster implements CappedWindowRequestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedWindowRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleCappedWindowRequestAdjuster implements CappedWindowRequestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: CappedWindowRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the capped window request steps in order and keeps a trace of each. */
export class CappedWindowRequestEngine {
  steps: CappedWindowRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedWindowRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedWindowRequest): number {
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

  evaluateAll(items: CappedWindowRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedWindowRequestEngine(flagsValue: flags.Registry): CappedWindowRequestEngine {
  return new CappedWindowRequestEngine(
    [
      new FlaggedCappedWindowRequestAdjuster(flagsValue, "capped-window-request-capped", -7.5),
      new PercentCappedWindowRequestAdjuster(8.8),
      new CapCappedWindowRequestAdjuster(18239),
      new TieredCappedWindowRequestAdjuster([6446, 9608], [0.8, 0.84]),
      new TitleCappedWindowRequestAdjuster(
        new Map<string, number>([["north", 1.22], ["central", 0.8], ["east", 0.86]]),
      ),
    ],
    [],
    4.1,
    51775.4,
  );
}
