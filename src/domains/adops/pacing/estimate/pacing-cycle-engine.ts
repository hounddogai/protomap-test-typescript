import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PacingCycle } from "./pacing-cycle.js";

/** One step of the pacing cycle calculation. */
export interface PacingCycleStep {
  describe(): string;
  adjust(item: PacingCycle, value: number): number;
}

export class MinimumPacingCycleAdjuster implements PacingCycleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PacingCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocalePacingCycleAdjuster implements PacingCycleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PacingCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPacingCycleAdjuster implements PacingCycleStep {
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

  adjust(item: PacingCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPacingCycleAdjuster implements PacingCycleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PacingCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPacingCycleAdjuster implements PacingCycleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PacingCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pacing cycle steps in order and keeps a trace of each. */
export class PacingCycleEngine {
  steps: PacingCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PacingCycle): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: PacingCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPacingCycleEngine(flagsValue: flags.Registry): PacingCycleEngine {
  return new PacingCycleEngine(
    [
      new MinimumPacingCycleAdjuster(14.5),
      new LocalePacingCycleAdjuster(new Map<string, number>([["east", 0.78]])),
      new FlaggedPacingCycleAdjuster(flagsValue, "pacing-cycle-batched", -3.9),
      new RoundingPacingCycleAdjuster(5),
      new PercentPacingCycleAdjuster(24.1),
    ],
    [],
    3.1,
    27941.5,
  );
}
