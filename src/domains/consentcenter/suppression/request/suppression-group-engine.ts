import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SuppressionGroup } from "./suppression-group.js";

/** One step of the suppression group calculation. */
export interface SuppressionGroupAdjuster {
  describe(): string;
  adjust(item: SuppressionGroup, value: number): number;
}

export class UnitSuppressionGroupAdjuster implements SuppressionGroupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: SuppressionGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class SuppressionGroupVersionOffsetAdjuster implements SuppressionGroupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: SuppressionGroup, value: number): number {
    return value + item.version * this.weight;
  }
}

export class FlaggedSuppressionGroupAdjuster implements SuppressionGroupAdjuster {
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

  adjust(item: SuppressionGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the suppression group steps in order and keeps a trace of each. */
export class SuppressionGroupEngine {
  steps: SuppressionGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SuppressionGroup): number {
    let current = item.netTotal();
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

  evaluateAll(items: SuppressionGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSuppressionGroupEngine(flagsValue: flags.Registry): SuppressionGroupEngine {
  return new SuppressionGroupEngine(
    [
      new UnitSuppressionGroupAdjuster(
        new Map<string, number>([["online", 1.28], ["central", 1.04], ["west", 0.92]]),
      ),
      new SuppressionGroupVersionOffsetAdjuster(1.62),
      new FlaggedSuppressionGroupAdjuster(flagsValue, "suppression-group-batched", 6.1),
    ],
    [],
    3.2,
    74706.6,
  );
}
