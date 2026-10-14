import * as flags from "../../../../kit/flags.js";
import { ManualActivationWindow } from "./manual-activation-window.js";

/** One step of the manual activation window calculation. */
export interface ManualActivationWindowFactor {
  describe(): string;
  adjust(item: ManualActivationWindow, value: number): number;
}

export class ChannelManualActivationWindowAdjuster implements ManualActivationWindowFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ManualActivationWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedManualActivationWindowAdjuster implements ManualActivationWindowFactor {
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

  adjust(item: ManualActivationWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapManualActivationWindowAdjuster implements ManualActivationWindowFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualActivationWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the manual activation window steps in order and keeps a trace of each. */
export class ManualActivationWindowEngine {
  steps: ManualActivationWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualActivationWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualActivationWindow): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: ManualActivationWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualActivationWindowEngine(flagsValue: flags.Registry): ManualActivationWindowEngine {
  return new ManualActivationWindowEngine(
    [
      new ChannelManualActivationWindowAdjuster(
        new Map<string, number>([["south", 0.78], ["west", 1.33], ["central", 0.91]]),
      ),
      new FlaggedManualActivationWindowAdjuster(flagsValue, "manual-activation-window-manual", 1.2),
      new CapManualActivationWindowAdjuster(14035),
    ],
    [],
    0.2,
    24502.4,
  );
}
