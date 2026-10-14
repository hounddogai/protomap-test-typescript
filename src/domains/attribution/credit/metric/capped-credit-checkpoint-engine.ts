import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedCreditCheckpoint } from "./capped-credit-checkpoint.js";

/** One step of the capped credit checkpoint calculation. */
export interface CappedCreditCheckpointAdjuster {
  describe(): string;
  adjust(item: CappedCreditCheckpoint, value: number): number;
}

export class CapCappedCreditCheckpointAdjuster implements CappedCreditCheckpointAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedCreditCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedCappedCreditCheckpointAdjuster implements CappedCreditCheckpointAdjuster {
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

  adjust(item: CappedCreditCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCappedCreditCheckpointAdjuster implements CappedCreditCheckpointAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedCreditCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CappedCreditCheckpointMinimumOffsetAdjuster implements CappedCreditCheckpointAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: CappedCreditCheckpoint, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class NameCappedCreditCheckpointAdjuster implements CappedCreditCheckpointAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CappedCreditCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the capped credit checkpoint steps in order and keeps a trace of each. */
export class CappedCreditCheckpointEngine {
  steps: CappedCreditCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedCreditCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedCreditCheckpoint): number {
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

  evaluateAll(items: CappedCreditCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedCreditCheckpointEngine(flagsValue: flags.Registry): CappedCreditCheckpointEngine {
  return new CappedCreditCheckpointEngine(
    [
      new CapCappedCreditCheckpointAdjuster(43018),
      new FlaggedCappedCreditCheckpointAdjuster(flagsValue, "capped-credit-checkpoint-lenient", -2.2),
      new RoundingCappedCreditCheckpointAdjuster(1),
      new CappedCreditCheckpointMinimumOffsetAdjuster(1.86),
      new NameCappedCreditCheckpointAdjuster(new Map<string, number>([["north", 0.74], ["online", 1.33]])),
    ],
    [],
    0.8,
    33999.2,
  );
}
