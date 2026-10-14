import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SenderBaseline } from "./sender-baseline.js";

/** One step of the sender baseline calculation. */
export interface SenderBaselineAdjuster {
  describe(): string;
  adjust(item: SenderBaseline, value: number): number;
}

export class FlaggedSenderBaselineAdjuster implements SenderBaselineAdjuster {
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

  adjust(item: SenderBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentSenderBaselineAdjuster implements SenderBaselineAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SenderBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSenderBaselineAdjuster implements SenderBaselineAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SenderBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the sender baseline steps in order and keeps a trace of each. */
export class SenderBaselineEngine {
  steps: SenderBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SenderBaseline): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: SenderBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSenderBaselineEngine(flagsValue: flags.Registry): SenderBaselineEngine {
  return new SenderBaselineEngine(
    [
      new FlaggedSenderBaselineAdjuster(flagsValue, "sender-baseline-pending", -4.3),
      new PercentSenderBaselineAdjuster(10.7),
      new RoundingSenderBaselineAdjuster(1),
    ],
    [],
    0.4,
    62048.1,
  );
}
