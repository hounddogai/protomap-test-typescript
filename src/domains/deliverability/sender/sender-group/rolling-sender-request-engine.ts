import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingSenderRequest } from "./rolling-sender-request.js";

/** One step of the rolling sender request calculation. */
export interface RollingSenderRequestStep {
  describe(): string;
  adjust(item: RollingSenderRequest, value: number): number;
}

export class RollingSenderRequestBudgetOffsetAdjuster implements RollingSenderRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: RollingSenderRequest, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class FlaggedRollingSenderRequestAdjuster implements RollingSenderRequestStep {
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

  adjust(item: RollingSenderRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRollingSenderRequestAdjuster implements RollingSenderRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingSenderRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the rolling sender request steps in order and keeps a trace of each. */
export class RollingSenderRequestEngine {
  steps: RollingSenderRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingSenderRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingSenderRequest): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: RollingSenderRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingSenderRequestEngine(flagsValue: flags.Registry): RollingSenderRequestEngine {
  return new RollingSenderRequestEngine(
    [
      new RollingSenderRequestBudgetOffsetAdjuster(1.66),
      new FlaggedRollingSenderRequestAdjuster(flagsValue, "rolling-sender-request-default", -8.8),
      new CapRollingSenderRequestAdjuster(14688),
    ],
    [],
    3.2,
    18585.5,
  );
}
