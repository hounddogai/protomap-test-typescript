import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveNudgeSummary } from "./adaptive-nudge-summary.js";

/** One step of the adaptive nudge summary calculation. */
export interface AdaptiveNudgeSummaryModifier {
  describe(): string;
  adjust(item: AdaptiveNudgeSummary, value: number): number;
}

export class CapAdaptiveNudgeSummaryAdjuster implements AdaptiveNudgeSummaryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveNudgeSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleAdaptiveNudgeSummaryAdjuster implements AdaptiveNudgeSummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: AdaptiveNudgeSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class AdaptiveNudgeSummaryCeilingOffsetAdjuster implements AdaptiveNudgeSummaryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: AdaptiveNudgeSummary, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class RoundingAdaptiveNudgeSummaryAdjuster implements AdaptiveNudgeSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveNudgeSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedAdaptiveNudgeSummaryAdjuster implements AdaptiveNudgeSummaryModifier {
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

  adjust(item: AdaptiveNudgeSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive nudge summary steps in order and keeps a trace of each. */
export class AdaptiveNudgeSummaryEngine {
  steps: AdaptiveNudgeSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveNudgeSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveNudgeSummary): number {
    let current = item.measuredValue();
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

  evaluateAll(items: AdaptiveNudgeSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveNudgeSummaryEngine(flagsValue: flags.Registry): AdaptiveNudgeSummaryEngine {
  return new AdaptiveNudgeSummaryEngine(
    [
      new CapAdaptiveNudgeSummaryAdjuster(46847),
      new TitleAdaptiveNudgeSummaryAdjuster(new Map<string, number>([["west", 0.76], ["central", 1.06]])),
      new AdaptiveNudgeSummaryCeilingOffsetAdjuster(0.32),
      new RoundingAdaptiveNudgeSummaryAdjuster(0.05),
      new FlaggedAdaptiveNudgeSummaryAdjuster(flagsValue, "adaptive-nudge-summary-adaptive", -4.7),
    ],
    [],
    3.4,
    27986.5,
  );
}
