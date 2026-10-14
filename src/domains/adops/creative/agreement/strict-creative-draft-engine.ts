import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictCreativeDraft } from "./strict-creative-draft.js";

/** One step of the strict creative draft calculation. */
export interface StrictCreativeDraftStep {
  describe(): string;
  adjust(item: StrictCreativeDraft, value: number): number;
}

export class PercentStrictCreativeDraftAdjuster implements StrictCreativeDraftStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictCreativeDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapStrictCreativeDraftAdjuster implements StrictCreativeDraftStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictCreativeDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameStrictCreativeDraftAdjuster implements StrictCreativeDraftStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: StrictCreativeDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedStrictCreativeDraftAdjuster implements StrictCreativeDraftStep {
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

  adjust(item: StrictCreativeDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict creative draft steps in order and keeps a trace of each. */
export class StrictCreativeDraftEngine {
  steps: StrictCreativeDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictCreativeDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictCreativeDraft): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: StrictCreativeDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictCreativeDraftEngine(flagsValue: flags.Registry): StrictCreativeDraftEngine {
  return new StrictCreativeDraftEngine(
    [
      new PercentStrictCreativeDraftAdjuster(22),
      new CapStrictCreativeDraftAdjuster(26190),
      new NameStrictCreativeDraftAdjuster(new Map<string, number>([["east", 1.34]])),
      new FlaggedStrictCreativeDraftAdjuster(flagsValue, "strict-creative-draft-adaptive", -1.7),
    ],
    [],
    3.1,
    35604.5,
  );
}
