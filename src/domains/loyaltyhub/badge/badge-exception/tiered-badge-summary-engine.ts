import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredBadgeSummary } from "./tiered-badge-summary.js";

/** One step of the tiered badge summary calculation. */
export interface TieredBadgeSummaryStep {
  describe(): string;
  adjust(item: TieredBadgeSummary, value: number): number;
}

export class TieredBadgeSummaryPriorityOffsetAdjuster implements TieredBadgeSummaryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: TieredBadgeSummary, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class CapTieredBadgeSummaryAdjuster implements TieredBadgeSummaryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredBadgeSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleTieredBadgeSummaryAdjuster implements TieredBadgeSummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: TieredBadgeSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentTieredBadgeSummaryAdjuster implements TieredBadgeSummaryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredBadgeSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedTieredBadgeSummaryAdjuster implements TieredBadgeSummaryStep {
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

  adjust(item: TieredBadgeSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered badge summary steps in order and keeps a trace of each. */
export class TieredBadgeSummaryEngine {
  steps: TieredBadgeSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredBadgeSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredBadgeSummary): number {
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

  evaluateAll(items: TieredBadgeSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredBadgeSummaryEngine(flagsValue: flags.Registry): TieredBadgeSummaryEngine {
  return new TieredBadgeSummaryEngine(
    [
      new TieredBadgeSummaryPriorityOffsetAdjuster(1.83),
      new CapTieredBadgeSummaryAdjuster(41402),
      new TitleTieredBadgeSummaryAdjuster(new Map<string, number>([["central", 1.19]])),
      new PercentTieredBadgeSummaryAdjuster(14.5),
      new FlaggedTieredBadgeSummaryAdjuster(flagsValue, "tiered-badge-summary-scheduled", -9.2),
    ],
    [],
    1.3,
    15590.6,
  );
}
