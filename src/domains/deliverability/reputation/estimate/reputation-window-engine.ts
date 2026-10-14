import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReputationWindow } from "./reputation-window.js";

/** One step of the reputation window calculation. */
export interface ReputationWindowFactor {
  describe(): string;
  adjust(item: ReputationWindow, value: number): number;
}

export class RoundingReputationWindowAdjuster implements ReputationWindowFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReputationWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ReputationWindowClicksOffsetAdjuster implements ReputationWindowFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: ReputationWindow, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class TieredReputationWindowAdjuster implements ReputationWindowFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReputationWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedReputationWindowAdjuster implements ReputationWindowFactor {
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

  adjust(item: ReputationWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapReputationWindowAdjuster implements ReputationWindowFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReputationWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the reputation window steps in order and keeps a trace of each. */
export class ReputationWindowEngine {
  steps: ReputationWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ReputationWindow): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ReputationWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultReputationWindowEngine(flagsValue: flags.Registry): ReputationWindowEngine {
  return new ReputationWindowEngine(
    [
      new RoundingReputationWindowAdjuster(1),
      new ReputationWindowClicksOffsetAdjuster(1.44),
      new TieredReputationWindowAdjuster([2130, 6067, 7813], [0.81, 0.84, 0.8]),
      new FlaggedReputationWindowAdjuster(flagsValue, "reputation-window-default", 8.6),
      new CapReputationWindowAdjuster(31125),
    ],
    [],
    1.6,
    15525,
  );
}
