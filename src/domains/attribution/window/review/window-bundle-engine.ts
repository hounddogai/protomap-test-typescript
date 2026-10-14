import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WindowBundle } from "./window-bundle.js";

/** One step of the window bundle calculation. */
export interface WindowBundleAdjuster {
  describe(): string;
  adjust(item: WindowBundle, value: number): number;
}

export class RoundingWindowBundleAdjuster implements WindowBundleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WindowBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapWindowBundleAdjuster implements WindowBundleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedWindowBundleAdjuster implements WindowBundleAdjuster {
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

  adjust(item: WindowBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the window bundle steps in order and keeps a trace of each. */
export class WindowBundleEngine {
  steps: WindowBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WindowBundle): number {
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

  evaluateAll(items: WindowBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWindowBundleEngine(flagsValue: flags.Registry): WindowBundleEngine {
  return new WindowBundleEngine(
    [
      new RoundingWindowBundleAdjuster(1),
      new CapWindowBundleAdjuster(9175),
      new FlaggedWindowBundleAdjuster(flagsValue, "window-bundle-tiered", -8.9),
    ],
    [],
    0.5,
    35796,
  );
}
