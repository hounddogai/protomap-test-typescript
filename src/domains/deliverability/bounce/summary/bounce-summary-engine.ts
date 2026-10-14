import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BounceSummary } from "./bounce-summary.js";

/** One step of the bounce summary calculation. */
export interface BounceSummaryModifier {
  describe(): string;
  adjust(item: BounceSummary, value: number): number;
}

export class CapBounceSummaryAdjuster implements BounceSummaryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BounceSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionBounceSummaryAdjuster implements BounceSummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: BounceSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedBounceSummaryAdjuster implements BounceSummaryModifier {
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

  adjust(item: BounceSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBounceSummaryAdjuster implements BounceSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BounceSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the bounce summary steps in order and keeps a trace of each. */
export class BounceSummaryEngine {
  steps: BounceSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BounceSummary): number {
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

  evaluateAll(items: BounceSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBounceSummaryEngine(flagsValue: flags.Registry): BounceSummaryEngine {
  return new BounceSummaryEngine(
    [
      new CapBounceSummaryAdjuster(3991),
      new RegionBounceSummaryAdjuster(new Map<string, number>([["west", 1.03]])),
      new FlaggedBounceSummaryAdjuster(flagsValue, "bounce-summary-pending", -7.4),
      new RoundingBounceSummaryAdjuster(0.05),
    ],
    [],
    1.5,
    38683.5,
  );
}
