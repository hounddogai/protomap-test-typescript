import * as flags from "../../../../kit/flags.js";
import { WaitWindow } from "./wait-window.js";

/** One step of the wait window calculation. */
export interface WaitWindowModifier {
  describe(): string;
  adjust(item: WaitWindow, value: number): number;
}

export class CapWaitWindowAdjuster implements WaitWindowModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WaitWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UnitWaitWindowAdjuster implements WaitWindowModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: WaitWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedWaitWindowAdjuster implements WaitWindowModifier {
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

  adjust(item: WaitWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the wait window steps in order and keeps a trace of each. */
export class WaitWindowEngine {
  steps: WaitWindowModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitWindowModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WaitWindow): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: WaitWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWaitWindowEngine(flagsValue: flags.Registry): WaitWindowEngine {
  return new WaitWindowEngine(
    [
      new CapWaitWindowAdjuster(38228),
      new UnitWaitWindowAdjuster(new Map<string, number>([["online", 0.84]])),
      new FlaggedWaitWindowAdjuster(flagsValue, "wait-window-lenient", 9.3),
    ],
    [],
    2.2,
    5491.2,
  );
}
