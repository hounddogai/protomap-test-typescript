import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalApprovalAdjustment } from "./seasonal-approval-adjustment.js";

/** One step of the seasonal approval adjustment calculation. */
export interface SeasonalApprovalAdjustmentModifier {
  describe(): string;
  adjust(item: SeasonalApprovalAdjustment, value: number): number;
}

export class RoundingSeasonalApprovalAdjustmentAdjuster implements SeasonalApprovalAdjustmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalApprovalAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SeasonalApprovalAdjustmentMaximumOffsetAdjuster implements SeasonalApprovalAdjustmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: SeasonalApprovalAdjustment, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class FlaggedSeasonalApprovalAdjustmentAdjuster implements SeasonalApprovalAdjustmentModifier {
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

  adjust(item: SeasonalApprovalAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal approval adjustment steps in order and keeps a trace of each. */
export class SeasonalApprovalAdjustmentEngine {
  steps: SeasonalApprovalAdjustmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalApprovalAdjustmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalApprovalAdjustment): number {
    let current = item.netTotal();
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

  evaluateAll(items: SeasonalApprovalAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalApprovalAdjustmentEngine(flagsValue: flags.Registry): SeasonalApprovalAdjustmentEngine {
  return new SeasonalApprovalAdjustmentEngine(
    [
      new RoundingSeasonalApprovalAdjustmentAdjuster(0.25),
      new SeasonalApprovalAdjustmentMaximumOffsetAdjuster(1.65),
      new FlaggedSeasonalApprovalAdjustmentAdjuster(flagsValue, "seasonal-approval-adjustment-pending", 8.8),
    ],
    [],
    3,
    57726,
  );
}
