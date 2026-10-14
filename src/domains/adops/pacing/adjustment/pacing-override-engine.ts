import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PacingOverride } from "./pacing-override.js";

/** One step of the pacing override calculation. */
export interface PacingOverrideAdjuster {
  describe(): string;
  adjust(item: PacingOverride, value: number): number;
}

export class MinimumPacingOverrideAdjuster implements PacingOverrideAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PacingOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPacingOverrideAdjuster implements PacingOverrideAdjuster {
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

  adjust(item: PacingOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPacingOverrideAdjuster implements PacingOverrideAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PacingOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPacingOverrideAdjuster implements PacingOverrideAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PacingOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UtmSourcePacingOverrideAdjuster implements PacingOverrideAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: PacingOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pacing override steps in order and keeps a trace of each. */
export class PacingOverrideEngine {
  steps: PacingOverrideAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingOverrideAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PacingOverride): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: PacingOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPacingOverrideEngine(flagsValue: flags.Registry): PacingOverrideEngine {
  return new PacingOverrideEngine(
    [
      new MinimumPacingOverrideAdjuster(47.1),
      new FlaggedPacingOverrideAdjuster(flagsValue, "pacing-override-batched", -8),
      new PercentPacingOverrideAdjuster(-24.6),
      new RoundingPacingOverrideAdjuster(0.05),
      new UtmSourcePacingOverrideAdjuster(new Map<string, number>([["west", 0.76]])),
    ],
    [],
    1.4,
    94663.8,
  );
}
