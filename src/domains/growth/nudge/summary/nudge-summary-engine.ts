import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { NudgeSummary } from "./nudge-summary.js";

/** One step of the nudge summary calculation. */
export interface NudgeSummaryModifier {
  describe(): string;
  adjust(item: NudgeSummary, value: number): number;
}

export class FlaggedNudgeSummaryAdjuster implements NudgeSummaryModifier {
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

  adjust(item: NudgeSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingNudgeSummaryAdjuster implements NudgeSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: NudgeSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredNudgeSummaryAdjuster implements NudgeSummaryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: NudgeSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the nudge summary steps in order and keeps a trace of each. */
export class NudgeSummaryEngine {
  steps: NudgeSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: NudgeSummary): number {
    let current = item.projectedValue();
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

  evaluateAll(items: NudgeSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultNudgeSummaryEngine(flagsValue: flags.Registry): NudgeSummaryEngine {
  return new NudgeSummaryEngine(
    [
      new FlaggedNudgeSummaryAdjuster(flagsValue, "nudge-summary-scheduled", 5.3),
      new RoundingNudgeSummaryAdjuster(5),
      new TieredNudgeSummaryAdjuster([3847, 3964, 10000], [0.89, 1, 0.82]),
    ],
    [],
    0.6,
    76429.1,
  );
}
