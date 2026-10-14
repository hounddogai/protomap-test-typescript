import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WindowSnapshot } from "./window-snapshot.js";

/** One step of the window snapshot calculation. */
export interface WindowSnapshotAdjuster {
  describe(): string;
  adjust(item: WindowSnapshot, value: number): number;
}

export class FlaggedWindowSnapshotAdjuster implements WindowSnapshotAdjuster {
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

  adjust(item: WindowSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapWindowSnapshotAdjuster implements WindowSnapshotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentWindowSnapshotAdjuster implements WindowSnapshotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WindowSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingWindowSnapshotAdjuster implements WindowSnapshotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WindowSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the window snapshot steps in order and keeps a trace of each. */
export class WindowSnapshotEngine {
  steps: WindowSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WindowSnapshot): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: WindowSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWindowSnapshotEngine(flagsValue: flags.Registry): WindowSnapshotEngine {
  return new WindowSnapshotEngine(
    [
      new FlaggedWindowSnapshotAdjuster(flagsValue, "window-snapshot-pending", -6.3),
      new CapWindowSnapshotAdjuster(42398),
      new PercentWindowSnapshotAdjuster(-15.8),
      new RoundingWindowSnapshotAdjuster(0.5),
    ],
    [],
    1.1,
    96317.6,
  );
}
