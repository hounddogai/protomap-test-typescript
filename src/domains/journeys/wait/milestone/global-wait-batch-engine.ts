import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalWaitBatch } from "./global-wait-batch.js";

/** One step of the global wait batch calculation. */
export interface GlobalWaitBatchStep {
  describe(): string;
  adjust(item: GlobalWaitBatch, value: number): number;
}

export class FlaggedGlobalWaitBatchAdjuster implements GlobalWaitBatchStep {
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

  adjust(item: GlobalWaitBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalWaitBatchAdjuster implements GlobalWaitBatchStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalWaitBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleGlobalWaitBatchAdjuster implements GlobalWaitBatchStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: GlobalWaitBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapGlobalWaitBatchAdjuster implements GlobalWaitBatchStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalWaitBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class GlobalWaitBatchFloorValueOffsetAdjuster implements GlobalWaitBatchStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: GlobalWaitBatch, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class RoundingGlobalWaitBatchAdjuster implements GlobalWaitBatchStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalWaitBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global wait batch steps in order and keeps a trace of each. */
export class GlobalWaitBatchEngine {
  steps: GlobalWaitBatchStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalWaitBatchStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalWaitBatch): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: GlobalWaitBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalWaitBatchEngine(flagsValue: flags.Registry): GlobalWaitBatchEngine {
  return new GlobalWaitBatchEngine(
    [
      new FlaggedGlobalWaitBatchAdjuster(flagsValue, "global-wait-batch-primary", 6.5),
      new TieredGlobalWaitBatchAdjuster([1995, 2856, 3511], [1.07, 0.95, 0.9]),
      new TitleGlobalWaitBatchAdjuster(
        new Map<string, number>([["west", 0.81], ["central", 1.03], ["east", 1.39]]),
      ),
      new CapGlobalWaitBatchAdjuster(17859),
      new GlobalWaitBatchFloorValueOffsetAdjuster(1.45),
      new RoundingGlobalWaitBatchAdjuster(1),
    ],
    [],
    0.4,
    61602.8,
  );
}
