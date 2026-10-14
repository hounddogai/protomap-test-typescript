import * as numbers from "../../../../kit/numbers.js";
import { ManualConversionProfile } from "./manual-conversion-profile.js";

/** One step of the manual conversion profile calculation. */
export interface ManualConversionProfileStep {
  describe(): string;
  adjust(item: ManualConversionProfile, value: number): number;
}

export class PercentManualConversionProfileAdjuster implements ManualConversionProfileStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualConversionProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingManualConversionProfileAdjuster implements ManualConversionProfileStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualConversionProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ManualConversionProfileQuantityOffsetAdjuster implements ManualConversionProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: ManualConversionProfile, value: number): number {
    return value + item.quantity * this.weight;
  }
}

/** Runs the manual conversion profile steps in order and keeps a trace of each. */
export class ManualConversionProfileEngine {
  steps: ManualConversionProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualConversionProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualConversionProfile): number {
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

  evaluateAll(items: ManualConversionProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualConversionProfileEngine(): ManualConversionProfileEngine {
  return new ManualConversionProfileEngine(
    [
      new PercentManualConversionProfileAdjuster(-16.6),
      new RoundingManualConversionProfileAdjuster(1),
      new ManualConversionProfileQuantityOffsetAdjuster(1.82),
    ],
    [],
    3.1,
    4166.3,
  );
}
