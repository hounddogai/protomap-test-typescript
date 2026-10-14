import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualNudgeException } from "./manual-nudge-exception.js";

/** One step of the manual nudge exception calculation. */
export interface ManualNudgeExceptionStep {
  describe(): string;
  adjust(item: ManualNudgeException, value: number): number;
}

export class FlaggedManualNudgeExceptionAdjuster implements ManualNudgeExceptionStep {
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

  adjust(item: ManualNudgeException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ManualNudgeExceptionFrequencyCapOffsetAdjuster implements ManualNudgeExceptionStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: ManualNudgeException, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class MinimumManualNudgeExceptionAdjuster implements ManualNudgeExceptionStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualNudgeException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredManualNudgeExceptionAdjuster implements ManualNudgeExceptionStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualNudgeException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingManualNudgeExceptionAdjuster implements ManualNudgeExceptionStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualNudgeException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentManualNudgeExceptionAdjuster implements ManualNudgeExceptionStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualNudgeException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual nudge exception steps in order and keeps a trace of each. */
export class ManualNudgeExceptionEngine {
  steps: ManualNudgeExceptionStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualNudgeExceptionStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualNudgeException): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: ManualNudgeException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualNudgeExceptionEngine(flagsValue: flags.Registry): ManualNudgeExceptionEngine {
  return new ManualNudgeExceptionEngine(
    [
      new FlaggedManualNudgeExceptionAdjuster(flagsValue, "manual-nudge-exception-pending", 7.2),
      new ManualNudgeExceptionFrequencyCapOffsetAdjuster(0.56),
      new MinimumManualNudgeExceptionAdjuster(10.5),
      new TieredManualNudgeExceptionAdjuster([242, 4845], [0.86, 1.15]),
      new RoundingManualNudgeExceptionAdjuster(5),
      new PercentManualNudgeExceptionAdjuster(-19.1),
    ],
    [],
    2,
    48380.8,
  );
}
