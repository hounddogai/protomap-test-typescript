import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultPacingSummary } from "./default-pacing-summary.js";

/** One step of the default pacing summary calculation. */
export interface DefaultPacingSummaryFactor {
  describe(): string;
  adjust(item: DefaultPacingSummary, value: number): number;
}

export class MinimumDefaultPacingSummaryAdjuster implements DefaultPacingSummaryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultPacingSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredDefaultPacingSummaryAdjuster implements DefaultPacingSummaryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultPacingSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDefaultPacingSummaryAdjuster implements DefaultPacingSummaryFactor {
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

  adjust(item: DefaultPacingSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default pacing summary steps in order and keeps a trace of each. */
export class DefaultPacingSummaryEngine {
  steps: DefaultPacingSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPacingSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultPacingSummary): number {
    let current = item.measuredValue();
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

  evaluateAll(items: DefaultPacingSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultPacingSummaryEngine(flagsValue: flags.Registry): DefaultPacingSummaryEngine {
  return new DefaultPacingSummaryEngine(
    [
      new MinimumDefaultPacingSummaryAdjuster(45.1),
      new TieredDefaultPacingSummaryAdjuster([1719, 8553], [0.9, 1.13]),
      new FlaggedDefaultPacingSummaryAdjuster(flagsValue, "default-pacing-summary-global", 8.4),
    ],
    [],
    0.3,
    68128.2,
  );
}
