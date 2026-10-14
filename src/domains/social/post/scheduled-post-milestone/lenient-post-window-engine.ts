import * as flags from "../../../../kit/flags.js";
import { LenientPostWindow } from "./lenient-post-window.js";

/** One step of the lenient post window calculation. */
export interface LenientPostWindowStep {
  describe(): string;
  adjust(item: LenientPostWindow, value: number): number;
}

export class FlaggedLenientPostWindowAdjuster implements LenientPostWindowStep {
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

  adjust(item: LenientPostWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LenientPostWindowStartsAtOffsetAdjuster implements LenientPostWindowStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: LenientPostWindow, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class PercentLenientPostWindowAdjuster implements LenientPostWindowStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientPostWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient post window steps in order and keeps a trace of each. */
export class LenientPostWindowEngine {
  steps: LenientPostWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientPostWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientPostWindow): number {
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

  evaluateAll(items: LenientPostWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientPostWindowEngine(flagsValue: flags.Registry): LenientPostWindowEngine {
  return new LenientPostWindowEngine(
    [
      new FlaggedLenientPostWindowAdjuster(flagsValue, "lenient-post-window-strict", 4.2),
      new LenientPostWindowStartsAtOffsetAdjuster(1.86),
      new PercentLenientPostWindowAdjuster(-11.4),
    ],
    [],
    2.2,
    56079.1,
  );
}
