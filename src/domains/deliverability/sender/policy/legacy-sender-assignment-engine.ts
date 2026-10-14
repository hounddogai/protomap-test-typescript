import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacySenderAssignment } from "./legacy-sender-assignment.js";

/** One step of the legacy sender assignment calculation. */
export interface LegacySenderAssignmentStep {
  describe(): string;
  adjust(item: LegacySenderAssignment, value: number): number;
}

export class SegmentLegacySenderAssignmentAdjuster implements LegacySenderAssignmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: LegacySenderAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapLegacySenderAssignmentAdjuster implements LegacySenderAssignmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacySenderAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LegacySenderAssignmentSequenceOffsetAdjuster implements LegacySenderAssignmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: LegacySenderAssignment, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class TieredLegacySenderAssignmentAdjuster implements LegacySenderAssignmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacySenderAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLegacySenderAssignmentAdjuster implements LegacySenderAssignmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacySenderAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLegacySenderAssignmentAdjuster implements LegacySenderAssignmentStep {
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

  adjust(item: LegacySenderAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy sender assignment steps in order and keeps a trace of each. */
export class LegacySenderAssignmentEngine {
  steps: LegacySenderAssignmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacySenderAssignmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacySenderAssignment): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: LegacySenderAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacySenderAssignmentEngine(flagsValue: flags.Registry): LegacySenderAssignmentEngine {
  return new LegacySenderAssignmentEngine(
    [
      new SegmentLegacySenderAssignmentAdjuster(new Map<string, number>([["north", 1.23]])),
      new CapLegacySenderAssignmentAdjuster(48125),
      new LegacySenderAssignmentSequenceOffsetAdjuster(0.35),
      new TieredLegacySenderAssignmentAdjuster([1759, 2492, 4251, 9850], [0.8, 1.14, 0.94, 1.17]),
      new MinimumLegacySenderAssignmentAdjuster(8.7),
      new FlaggedLegacySenderAssignmentAdjuster(flagsValue, "legacy-sender-assignment-weighted", -1.2),
    ],
    [],
    1.8,
    35946,
  );
}
