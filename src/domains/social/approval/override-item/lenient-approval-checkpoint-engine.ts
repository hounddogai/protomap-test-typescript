import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientApprovalCheckpoint } from "./lenient-approval-checkpoint.js";

/** One step of the lenient approval checkpoint calculation. */
export interface LenientApprovalCheckpointModifier {
  describe(): string;
  adjust(item: LenientApprovalCheckpoint, value: number): number;
}

export class FlaggedLenientApprovalCheckpointAdjuster implements LenientApprovalCheckpointModifier {
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

  adjust(item: LenientApprovalCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLenientApprovalCheckpointAdjuster implements LenientApprovalCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientApprovalCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredLenientApprovalCheckpointAdjuster implements LenientApprovalCheckpointModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientApprovalCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLenientApprovalCheckpointAdjuster implements LenientApprovalCheckpointModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientApprovalCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientApprovalCheckpointAdjuster implements LenientApprovalCheckpointModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientApprovalCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CategoryLenientApprovalCheckpointAdjuster implements LenientApprovalCheckpointModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: LenientApprovalCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the lenient approval checkpoint steps in order and keeps a trace of each. */
export class LenientApprovalCheckpointEngine {
  steps: LenientApprovalCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientApprovalCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientApprovalCheckpoint): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: LenientApprovalCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientApprovalCheckpointEngine(flagsValue: flags.Registry): LenientApprovalCheckpointEngine {
  return new LenientApprovalCheckpointEngine(
    [
      new FlaggedLenientApprovalCheckpointAdjuster(flagsValue, "lenient-approval-checkpoint-strict", 2.5),
      new CapLenientApprovalCheckpointAdjuster(38915),
      new TieredLenientApprovalCheckpointAdjuster([565, 7807], [0.93, 1]),
      new PercentLenientApprovalCheckpointAdjuster(-5),
      new RoundingLenientApprovalCheckpointAdjuster(0.05),
      new CategoryLenientApprovalCheckpointAdjuster(new Map<string, number>([["east", 0.72]])),
    ],
    [],
    2.1,
    92333.1,
  );
}
