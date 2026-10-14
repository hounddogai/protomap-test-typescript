import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SlaBaseline } from "./sla-baseline.js";

/** One step of the sla baseline calculation. */
export interface SlaBaselineFactor {
  describe(): string;
  adjust(item: SlaBaseline, value: number): number;
}

export class FlaggedSlaBaselineAdjuster implements SlaBaselineFactor {
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

  adjust(item: SlaBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredSlaBaselineAdjuster implements SlaBaselineFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SlaBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingSlaBaselineAdjuster implements SlaBaselineFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumSlaBaselineAdjuster implements SlaBaselineFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SlaBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the sla baseline steps in order and keeps a trace of each. */
export class SlaBaselineEngine {
  steps: SlaBaselineFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaBaselineFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SlaBaseline): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: SlaBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSlaBaselineEngine(flagsValue: flags.Registry): SlaBaselineEngine {
  return new SlaBaselineEngine(
    [
      new FlaggedSlaBaselineAdjuster(flagsValue, "sla-baseline-regional", -8.4),
      new TieredSlaBaselineAdjuster([2738, 6202, 6428], [1.14, 1.07, 1.18]),
      new RoundingSlaBaselineAdjuster(0.05),
      new MinimumSlaBaselineAdjuster(24.9),
    ],
    [],
    0.1,
    53543.1,
  );
}
