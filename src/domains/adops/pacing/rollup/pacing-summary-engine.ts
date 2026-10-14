import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PacingSummary } from "./pacing-summary.js";

/** One step of the pacing summary calculation. */
export interface PacingSummaryStep {
  describe(): string;
  adjust(item: PacingSummary, value: number): number;
}

export class RoundingPacingSummaryAdjuster implements PacingSummaryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PacingSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CountryPacingSummaryAdjuster implements PacingSummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PacingSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPacingSummaryAdjuster implements PacingSummaryStep {
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

  adjust(item: PacingSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pacing summary steps in order and keeps a trace of each. */
export class PacingSummaryEngine {
  steps: PacingSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PacingSummary): number {
    let current = item.netLoad();
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

  evaluateAll(items: PacingSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPacingSummaryEngine(flagsValue: flags.Registry): PacingSummaryEngine {
  return new PacingSummaryEngine(
    [
      new RoundingPacingSummaryAdjuster(0.1),
      new CountryPacingSummaryAdjuster(new Map<string, number>([["retail", 1.1], ["south", 1.39]])),
      new FlaggedPacingSummaryAdjuster(flagsValue, "pacing-summary-regional", 7.9),
    ],
    [],
    2.2,
    18659.4,
  );
}
