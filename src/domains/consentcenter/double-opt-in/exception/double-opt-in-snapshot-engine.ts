import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInSnapshot } from "./double-opt-in-snapshot.js";

/** One step of the double opt in snapshot calculation. */
export interface DoubleOptInSnapshotAdjuster {
  describe(): string;
  adjust(item: DoubleOptInSnapshot, value: number): number;
}

export class CapDoubleOptInSnapshotAdjuster implements DoubleOptInSnapshotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class DoubleOptInSnapshotThresholdOffsetAdjuster implements DoubleOptInSnapshotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: DoubleOptInSnapshot, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class PercentDoubleOptInSnapshotAdjuster implements DoubleOptInSnapshotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedDoubleOptInSnapshotAdjuster implements DoubleOptInSnapshotAdjuster {
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

  adjust(item: DoubleOptInSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDoubleOptInSnapshotAdjuster implements DoubleOptInSnapshotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DoubleOptInSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the double opt in snapshot steps in order and keeps a trace of each. */
export class DoubleOptInSnapshotEngine {
  steps: DoubleOptInSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DoubleOptInSnapshot): number {
    let current = item.netExposure();
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

  evaluateAll(items: DoubleOptInSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDoubleOptInSnapshotEngine(flagsValue: flags.Registry): DoubleOptInSnapshotEngine {
  return new DoubleOptInSnapshotEngine(
    [
      new CapDoubleOptInSnapshotAdjuster(36815),
      new DoubleOptInSnapshotThresholdOffsetAdjuster(0.61),
      new PercentDoubleOptInSnapshotAdjuster(-13),
      new FlaggedDoubleOptInSnapshotAdjuster(flagsValue, "double-opt-in-snapshot-strict", -1.6),
      new RoundingDoubleOptInSnapshotAdjuster(0.25),
    ],
    [],
    3.8,
    82506.9,
  );
}
