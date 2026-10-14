import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingPacingBatch } from "./rolling-pacing-batch.js";

/** One step of the rolling pacing batch calculation. */
export interface RollingPacingBatchStep {
  describe(): string;
  adjust(item: RollingPacingBatch, value: number): number;
}

export class PercentRollingPacingBatchAdjuster implements RollingPacingBatchStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingPacingBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRollingPacingBatchAdjuster implements RollingPacingBatchStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingPacingBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRollingPacingBatchAdjuster implements RollingPacingBatchStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingPacingBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRollingPacingBatchAdjuster implements RollingPacingBatchStep {
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

  adjust(item: RollingPacingBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameRollingPacingBatchAdjuster implements RollingPacingBatchStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RollingPacingBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling pacing batch steps in order and keeps a trace of each. */
export class RollingPacingBatchEngine {
  steps: RollingPacingBatchStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingPacingBatchStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingPacingBatch): number {
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

  evaluateAll(items: RollingPacingBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingPacingBatchEngine(flagsValue: flags.Registry): RollingPacingBatchEngine {
  return new RollingPacingBatchEngine(
    [
      new PercentRollingPacingBatchAdjuster(-15.6),
      new TieredRollingPacingBatchAdjuster([1545, 2422, 8371, 8935], [0.97, 0.87, 1.18, 0.85]),
      new CapRollingPacingBatchAdjuster(44731),
      new FlaggedRollingPacingBatchAdjuster(flagsValue, "rolling-pacing-batch-capped", 2),
      new NameRollingPacingBatchAdjuster(
        new Map<string, number>([["online", 1.3], ["south", 0.77], ["retail", 1.38]]),
      ),
    ],
    [],
    1.6,
    28882.4,
  );
}
