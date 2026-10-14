import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FunnelWindow } from "./funnel-window.js";

/** One step of the funnel window calculation. */
export interface FunnelWindowAdjuster {
  describe(): string;
  adjust(item: FunnelWindow, value: number): number;
}

export class FlaggedFunnelWindowAdjuster implements FunnelWindowAdjuster {
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

  adjust(item: FunnelWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapFunnelWindowAdjuster implements FunnelWindowAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentFunnelWindowAdjuster implements FunnelWindowAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the funnel window steps in order and keeps a trace of each. */
export class FunnelWindowEngine {
  steps: FunnelWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FunnelWindow): number {
    let current = item.weightedValue();
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

  evaluateAll(items: FunnelWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFunnelWindowEngine(flagsValue: flags.Registry): FunnelWindowEngine {
  return new FunnelWindowEngine(
    [
      new FlaggedFunnelWindowAdjuster(flagsValue, "funnel-window-manual", 1),
      new CapFunnelWindowAdjuster(10488),
      new PercentFunnelWindowAdjuster(2.1),
    ],
    [],
    2.1,
    30925.4,
  );
}
