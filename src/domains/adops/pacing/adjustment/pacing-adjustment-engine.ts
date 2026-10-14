import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PacingAdjustment } from "./pacing-adjustment.js";

/** One step of the pacing adjustment calculation. */
export interface PacingAdjustmentStep {
  describe(): string;
  adjust(item: PacingAdjustment, value: number): number;
}

export class RoundingPacingAdjustmentAdjuster implements PacingAdjustmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PacingAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPacingAdjustmentAdjuster implements PacingAdjustmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PacingAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPacingAdjustmentAdjuster implements PacingAdjustmentStep {
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

  adjust(item: PacingAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UnitPacingAdjustmentAdjuster implements PacingAdjustmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: PacingAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPacingAdjustmentAdjuster implements PacingAdjustmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PacingAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pacing adjustment steps in order and keeps a trace of each. */
export class PacingAdjustmentEngine {
  steps: PacingAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PacingAdjustment): number {
    let current = item.netValue();
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

  evaluateAll(items: PacingAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPacingAdjustmentEngine(flagsValue: flags.Registry): PacingAdjustmentEngine {
  return new PacingAdjustmentEngine(
    [
      new RoundingPacingAdjustmentAdjuster(0.1),
      new PercentPacingAdjustmentAdjuster(-14.2),
      new FlaggedPacingAdjustmentAdjuster(flagsValue, "pacing-adjustment-manual", -1.5),
      new UnitPacingAdjustmentAdjuster(new Map<string, number>([["south", 0.81], ["east", 1.07]])),
      new MinimumPacingAdjustmentAdjuster(47.3),
    ],
    [],
    1.6,
    61309.1,
  );
}
