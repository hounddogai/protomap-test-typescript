import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CsatBatch } from "./csat-batch.js";

/** One step of the csat batch calculation. */
export interface CsatBatchStep {
  describe(): string;
  adjust(item: CsatBatch, value: number): number;
}

export class NameCsatBatchAdjuster implements CsatBatchStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CsatBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingCsatBatchAdjuster implements CsatBatchStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CsatBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedCsatBatchAdjuster implements CsatBatchStep {
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

  adjust(item: CsatBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCsatBatchAdjuster implements CsatBatchStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CsatBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the csat batch steps in order and keeps a trace of each. */
export class CsatBatchEngine {
  steps: CsatBatchStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatBatchStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CsatBatch): number {
    let current = item.netExposure();
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

  evaluateAll(items: CsatBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCsatBatchEngine(flagsValue: flags.Registry): CsatBatchEngine {
  return new CsatBatchEngine(
    [
      new NameCsatBatchAdjuster(new Map<string, number>([["north", 1.33], ["east", 1.15], ["retail", 0.78]])),
      new RoundingCsatBatchAdjuster(5),
      new FlaggedCsatBatchAdjuster(flagsValue, "csat-batch-scheduled", -0.8),
      new PercentCsatBatchAdjuster(-13.6),
    ],
    [],
    3.9,
    1607.6,
  );
}
