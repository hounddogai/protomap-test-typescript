import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredTouchpointWindow } from "./tiered-touchpoint-window.js";

/** One step of the tiered touchpoint window calculation. */
export interface TieredTouchpointWindowStep {
  describe(): string;
  adjust(item: TieredTouchpointWindow, value: number): number;
}

export class RoundingTieredTouchpointWindowAdjuster implements TieredTouchpointWindowStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredTouchpointWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentTieredTouchpointWindowAdjuster implements TieredTouchpointWindowStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredTouchpointWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedTieredTouchpointWindowAdjuster implements TieredTouchpointWindowStep {
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

  adjust(item: TieredTouchpointWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SourceTieredTouchpointWindowAdjuster implements TieredTouchpointWindowStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: TieredTouchpointWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered touchpoint window steps in order and keeps a trace of each. */
export class TieredTouchpointWindowEngine {
  steps: TieredTouchpointWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredTouchpointWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredTouchpointWindow): number {
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

  evaluateAll(items: TieredTouchpointWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredTouchpointWindowEngine(flagsValue: flags.Registry): TieredTouchpointWindowEngine {
  return new TieredTouchpointWindowEngine(
    [
      new RoundingTieredTouchpointWindowAdjuster(0.5),
      new PercentTieredTouchpointWindowAdjuster(-13.5),
      new FlaggedTieredTouchpointWindowAdjuster(flagsValue, "tiered-touchpoint-window-scheduled", 2.6),
      new SourceTieredTouchpointWindowAdjuster(new Map<string, number>([["west", 0.86]])),
    ],
    [],
    4.7,
    14680.3,
  );
}
