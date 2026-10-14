import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PathTarget } from "./path-target.js";

/** One step of the path target calculation. */
export interface PathTargetAdjuster {
  describe(): string;
  adjust(item: PathTarget, value: number): number;
}

export class FlaggedPathTargetAdjuster implements PathTargetAdjuster {
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

  adjust(item: PathTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PathTargetQuantityOffsetAdjuster implements PathTargetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: PathTarget, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class PercentPathTargetAdjuster implements PathTargetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the path target steps in order and keeps a trace of each. */
export class PathTargetEngine {
  steps: PathTargetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathTargetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PathTarget): number {
    let current = item.weightedValue();
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

  evaluateAll(items: PathTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPathTargetEngine(flagsValue: flags.Registry): PathTargetEngine {
  return new PathTargetEngine(
    [
      new FlaggedPathTargetAdjuster(flagsValue, "path-target-pending", 4.9),
      new PathTargetQuantityOffsetAdjuster(1.87),
      new PercentPathTargetAdjuster(-2.6),
    ],
    [],
    2.1,
    10619.1,
  );
}
