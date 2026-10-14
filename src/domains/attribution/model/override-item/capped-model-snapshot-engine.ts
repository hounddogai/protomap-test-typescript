import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedModelSnapshot } from "./capped-model-snapshot.js";

/** One step of the capped model snapshot calculation. */
export interface CappedModelSnapshotAdjuster {
  describe(): string;
  adjust(item: CappedModelSnapshot, value: number): number;
}

export class RoundingCappedModelSnapshotAdjuster implements CappedModelSnapshotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedModelSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedCappedModelSnapshotAdjuster implements CappedModelSnapshotAdjuster {
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

  adjust(item: CappedModelSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UnitCappedModelSnapshotAdjuster implements CappedModelSnapshotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: CappedModelSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapCappedModelSnapshotAdjuster implements CappedModelSnapshotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedModelSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CappedModelSnapshotThresholdOffsetAdjuster implements CappedModelSnapshotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: CappedModelSnapshot, value: number): number {
    return value + item.threshold * this.weight;
  }
}

/** Runs the capped model snapshot steps in order and keeps a trace of each. */
export class CappedModelSnapshotEngine {
  steps: CappedModelSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedModelSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedModelSnapshot): number {
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

  evaluateAll(items: CappedModelSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedModelSnapshotEngine(flagsValue: flags.Registry): CappedModelSnapshotEngine {
  return new CappedModelSnapshotEngine(
    [
      new RoundingCappedModelSnapshotAdjuster(1),
      new FlaggedCappedModelSnapshotAdjuster(flagsValue, "capped-model-snapshot-global", 2.7),
      new UnitCappedModelSnapshotAdjuster(new Map<string, number>([["west", 1.28], ["retail", 1.17]])),
      new CapCappedModelSnapshotAdjuster(48023),
      new CappedModelSnapshotThresholdOffsetAdjuster(1.51),
    ],
    [],
    4.7,
    84016.4,
  );
}
