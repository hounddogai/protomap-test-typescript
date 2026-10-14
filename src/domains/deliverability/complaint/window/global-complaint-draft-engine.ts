import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalComplaintDraft } from "./global-complaint-draft.js";

/** One step of the global complaint draft calculation. */
export interface GlobalComplaintDraftStep {
  describe(): string;
  adjust(item: GlobalComplaintDraft, value: number): number;
}

export class PercentGlobalComplaintDraftAdjuster implements GlobalComplaintDraftStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalComplaintDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedGlobalComplaintDraftAdjuster implements GlobalComplaintDraftStep {
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

  adjust(item: GlobalComplaintDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingGlobalComplaintDraftAdjuster implements GlobalComplaintDraftStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalComplaintDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumGlobalComplaintDraftAdjuster implements GlobalComplaintDraftStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalComplaintDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameGlobalComplaintDraftAdjuster implements GlobalComplaintDraftStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: GlobalComplaintDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredGlobalComplaintDraftAdjuster implements GlobalComplaintDraftStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalComplaintDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the global complaint draft steps in order and keeps a trace of each. */
export class GlobalComplaintDraftEngine {
  steps: GlobalComplaintDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalComplaintDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalComplaintDraft): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: GlobalComplaintDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalComplaintDraftEngine(flagsValue: flags.Registry): GlobalComplaintDraftEngine {
  return new GlobalComplaintDraftEngine(
    [
      new PercentGlobalComplaintDraftAdjuster(16.3),
      new FlaggedGlobalComplaintDraftAdjuster(flagsValue, "global-complaint-draft-pending", 8.8),
      new RoundingGlobalComplaintDraftAdjuster(1),
      new MinimumGlobalComplaintDraftAdjuster(29.5),
      new NameGlobalComplaintDraftAdjuster(new Map<string, number>([["retail", 0.89], ["central", 1.13]])),
      new TieredGlobalComplaintDraftAdjuster([3308, 3657, 4423, 4942], [0.91, 1.17, 1.08, 1.01]),
    ],
    [],
    1.8,
    44084.2,
  );
}
