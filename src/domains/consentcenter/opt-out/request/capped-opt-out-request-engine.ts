import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedOptOutRequest } from "./capped-opt-out-request.js";

/** One step of the capped opt out request calculation. */
export interface CappedOptOutRequestAdjuster {
  describe(): string;
  adjust(item: CappedOptOutRequest, value: number): number;
}

export class CapCappedOptOutRequestAdjuster implements CappedOptOutRequestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedOptOutRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentCappedOptOutRequestAdjuster implements CappedOptOutRequestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedOptOutRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedCappedOptOutRequestAdjuster implements CappedOptOutRequestAdjuster {
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

  adjust(item: CappedOptOutRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped opt out request steps in order and keeps a trace of each. */
export class CappedOptOutRequestEngine {
  steps: CappedOptOutRequestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedOptOutRequestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedOptOutRequest): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: CappedOptOutRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedOptOutRequestEngine(flagsValue: flags.Registry): CappedOptOutRequestEngine {
  return new CappedOptOutRequestEngine(
    [
      new CapCappedOptOutRequestAdjuster(45628),
      new PercentCappedOptOutRequestAdjuster(-14.9),
      new FlaggedCappedOptOutRequestAdjuster(flagsValue, "capped-opt-out-request-global", -2.9),
    ],
    [],
    4.1,
    32758.7,
  );
}
