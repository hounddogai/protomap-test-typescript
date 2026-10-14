import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingTouchpointWindow } from "./pending-touchpoint-window.js";

/** One step of the pending touchpoint window calculation. */
export interface PendingTouchpointWindowAdjuster {
  describe(): string;
  adjust(item: PendingTouchpointWindow, value: number): number;
}

export class CapPendingTouchpointWindowAdjuster implements PendingTouchpointWindowAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingTouchpointWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PendingTouchpointWindowBidOffsetAdjuster implements PendingTouchpointWindowAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: PendingTouchpointWindow, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class PercentPendingTouchpointWindowAdjuster implements PendingTouchpointWindowAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingTouchpointWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPendingTouchpointWindowAdjuster implements PendingTouchpointWindowAdjuster {
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

  adjust(item: PendingTouchpointWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending touchpoint window steps in order and keeps a trace of each. */
export class PendingTouchpointWindowEngine {
  steps: PendingTouchpointWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingTouchpointWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingTouchpointWindow): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: PendingTouchpointWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingTouchpointWindowEngine(flagsValue: flags.Registry): PendingTouchpointWindowEngine {
  return new PendingTouchpointWindowEngine(
    [
      new CapPendingTouchpointWindowAdjuster(23378),
      new PendingTouchpointWindowBidOffsetAdjuster(0.85),
      new PercentPendingTouchpointWindowAdjuster(8.1),
      new FlaggedPendingTouchpointWindowAdjuster(flagsValue, "pending-touchpoint-window-pending", 4.3),
    ],
    [],
    3.7,
    57575.9,
  );
}
