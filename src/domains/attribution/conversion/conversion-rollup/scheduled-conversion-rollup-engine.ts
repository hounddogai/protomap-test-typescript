import * as numbers from "../../../../kit/numbers.js";
import { ScheduledConversionRollup } from "./scheduled-conversion-rollup.js";

/** One step of the scheduled conversion rollup calculation. */
export interface ScheduledConversionRollupModifier {
  describe(): string;
  adjust(item: ScheduledConversionRollup, value: number): number;
}

export class RoundingScheduledConversionRollupAdjuster implements ScheduledConversionRollupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledConversionRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapScheduledConversionRollupAdjuster implements ScheduledConversionRollupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledConversionRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UtmSourceScheduledConversionRollupAdjuster implements ScheduledConversionRollupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: ScheduledConversionRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the scheduled conversion rollup steps in order and keeps a trace of each. */
export class ScheduledConversionRollupEngine {
  steps: ScheduledConversionRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledConversionRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledConversionRollup): number {
    let current = item.netTotal();
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

  evaluateAll(items: ScheduledConversionRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledConversionRollupEngine(): ScheduledConversionRollupEngine {
  return new ScheduledConversionRollupEngine(
    [
      new RoundingScheduledConversionRollupAdjuster(0.1),
      new CapScheduledConversionRollupAdjuster(12079),
      new UtmSourceScheduledConversionRollupAdjuster(new Map<string, number>([["north", 1.28]])),
    ],
    [],
    0.1,
    77943.6,
  );
}
