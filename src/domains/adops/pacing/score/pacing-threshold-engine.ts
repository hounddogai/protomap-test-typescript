import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PacingThreshold } from "./pacing-threshold.js";

/** One step of the pacing threshold calculation. */
export interface PacingThresholdStep {
  describe(): string;
  adjust(item: PacingThreshold, value: number): number;
}

export class PacingThresholdCreatedAtOffsetAdjuster implements PacingThresholdStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: PacingThreshold, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class TieredPacingThresholdAdjuster implements PacingThresholdStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PacingThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPacingThresholdAdjuster implements PacingThresholdStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PacingThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPacingThresholdAdjuster implements PacingThresholdStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PacingThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPacingThresholdAdjuster implements PacingThresholdStep {
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

  adjust(item: PacingThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pacing threshold steps in order and keeps a trace of each. */
export class PacingThresholdEngine {
  steps: PacingThresholdStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingThresholdStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PacingThreshold): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: PacingThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPacingThresholdEngine(flagsValue: flags.Registry): PacingThresholdEngine {
  return new PacingThresholdEngine(
    [
      new PacingThresholdCreatedAtOffsetAdjuster(1.79),
      new TieredPacingThresholdAdjuster([297, 1442, 4975, 7885], [0.91, 1.05, 0.81, 1.07]),
      new MinimumPacingThresholdAdjuster(25.8),
      new CapPacingThresholdAdjuster(20620),
      new FlaggedPacingThresholdAdjuster(flagsValue, "pacing-threshold-strict", 3.7),
    ],
    [],
    2.8,
    94026,
  );
}
