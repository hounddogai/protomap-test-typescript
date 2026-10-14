import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StepSnapshot } from "./step-snapshot.js";

/** One step of the step snapshot calculation. */
export interface StepSnapshotModifier {
  describe(): string;
  adjust(item: StepSnapshot, value: number): number;
}

export class FlaggedStepSnapshotAdjuster implements StepSnapshotModifier {
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

  adjust(item: StepSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentStepSnapshotAdjuster implements StepSnapshotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StepSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class UtmSourceStepSnapshotAdjuster implements StepSnapshotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: StepSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredStepSnapshotAdjuster implements StepSnapshotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StepSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingStepSnapshotAdjuster implements StepSnapshotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StepSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapStepSnapshotAdjuster implements StepSnapshotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the step snapshot steps in order and keeps a trace of each. */
export class StepSnapshotEngine {
  steps: StepSnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepSnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StepSnapshot): number {
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

  evaluateAll(items: StepSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStepSnapshotEngine(flagsValue: flags.Registry): StepSnapshotEngine {
  return new StepSnapshotEngine(
    [
      new FlaggedStepSnapshotAdjuster(flagsValue, "step-snapshot-seasonal", 3.6),
      new PercentStepSnapshotAdjuster(2.2),
      new UtmSourceStepSnapshotAdjuster(new Map<string, number>([["east", 0.74], ["north", 0.8]])),
      new TieredStepSnapshotAdjuster([3381, 8125], [0.95, 0.93]),
      new RoundingStepSnapshotAdjuster(0.5),
      new CapStepSnapshotAdjuster(15872),
    ],
    [],
    0,
    23707.9,
  );
}
