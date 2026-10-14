import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackInsightDraft } from "./fallback-insight-draft.js";

/** One step of the fallback insight draft calculation. */
export interface FallbackInsightDraftStep {
  describe(): string;
  adjust(item: FallbackInsightDraft, value: number): number;
}

export class FlaggedFallbackInsightDraftAdjuster implements FallbackInsightDraftStep {
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

  adjust(item: FallbackInsightDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapFallbackInsightDraftAdjuster implements FallbackInsightDraftStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackInsightDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentFallbackInsightDraftAdjuster implements FallbackInsightDraftStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackInsightDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackInsightDraftAdjuster implements FallbackInsightDraftStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackInsightDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelFallbackInsightDraftAdjuster implements FallbackInsightDraftStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FallbackInsightDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the fallback insight draft steps in order and keeps a trace of each. */
export class FallbackInsightDraftEngine {
  steps: FallbackInsightDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackInsightDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackInsightDraft): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: FallbackInsightDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackInsightDraftEngine(flagsValue: flags.Registry): FallbackInsightDraftEngine {
  return new FallbackInsightDraftEngine(
    [
      new FlaggedFallbackInsightDraftAdjuster(flagsValue, "fallback-insight-draft-seasonal", -8.4),
      new CapFallbackInsightDraftAdjuster(21727),
      new PercentFallbackInsightDraftAdjuster(17.2),
      new RoundingFallbackInsightDraftAdjuster(0.25),
      new LabelFallbackInsightDraftAdjuster(new Map<string, number>([["east", 1.07], ["west", 1.26]])),
    ],
    [],
    0.1,
    7123.4,
  );
}
