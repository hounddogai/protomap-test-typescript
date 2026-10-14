import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredQueueMapping } from "./tiered-queue-mapping.js";

/** One step of the tiered queue mapping calculation. */
export interface TieredQueueMappingModifier {
  describe(): string;
  adjust(item: TieredQueueMapping, value: number): number;
}

export class TieredQueueMappingFloorValueOffsetAdjuster implements TieredQueueMappingModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: TieredQueueMapping, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class TieredTieredQueueMappingAdjuster implements TieredQueueMappingModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredQueueMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapTieredQueueMappingAdjuster implements TieredQueueMappingModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredQueueMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedTieredQueueMappingAdjuster implements TieredQueueMappingModifier {
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

  adjust(item: TieredQueueMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentTieredQueueMappingAdjuster implements TieredQueueMappingModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredQueueMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredQueueMappingAdjuster implements TieredQueueMappingModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredQueueMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered queue mapping steps in order and keeps a trace of each. */
export class TieredQueueMappingEngine {
  steps: TieredQueueMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredQueueMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredQueueMapping): number {
    let current = item.measuredValue();
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

  evaluateAll(items: TieredQueueMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredQueueMappingEngine(flagsValue: flags.Registry): TieredQueueMappingEngine {
  return new TieredQueueMappingEngine(
    [
      new TieredQueueMappingFloorValueOffsetAdjuster(0.31),
      new TieredTieredQueueMappingAdjuster([1921, 4484], [1.18, 0.89]),
      new CapTieredQueueMappingAdjuster(42855),
      new FlaggedTieredQueueMappingAdjuster(flagsValue, "tiered-queue-mapping-capped", -8.7),
      new PercentTieredQueueMappingAdjuster(-19.1),
      new RoundingTieredQueueMappingAdjuster(5),
    ],
    [],
    1.2,
    70498.6,
  );
}
