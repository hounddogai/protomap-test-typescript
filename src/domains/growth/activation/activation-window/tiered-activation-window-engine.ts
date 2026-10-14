import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredActivationWindow } from "./tiered-activation-window.js";

/** One step of the tiered activation window calculation. */
export interface TieredActivationWindowFactor {
  describe(): string;
  adjust(item: TieredActivationWindow, value: number): number;
}

export class PercentTieredActivationWindowAdjuster implements TieredActivationWindowFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredActivationWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedTieredActivationWindowAdjuster implements TieredActivationWindowFactor {
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

  adjust(item: TieredActivationWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredActivationWindowAdjuster implements TieredActivationWindowFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredActivationWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered activation window steps in order and keeps a trace of each. */
export class TieredActivationWindowEngine {
  steps: TieredActivationWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredActivationWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredActivationWindow): number {
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

  evaluateAll(items: TieredActivationWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredActivationWindowEngine(flagsValue: flags.Registry): TieredActivationWindowEngine {
  return new TieredActivationWindowEngine(
    [
      new PercentTieredActivationWindowAdjuster(-6.6),
      new FlaggedTieredActivationWindowAdjuster(flagsValue, "tiered-activation-window-legacy", -0.3),
      new RoundingTieredActivationWindowAdjuster(5),
    ],
    [],
    0.4,
    54914.6,
  );
}
