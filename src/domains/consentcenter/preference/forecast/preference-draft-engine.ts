import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PreferenceDraft } from "./preference-draft.js";

/** One step of the preference draft calculation. */
export interface PreferenceDraftAdjuster {
  describe(): string;
  adjust(item: PreferenceDraft, value: number): number;
}

export class FlaggedPreferenceDraftAdjuster implements PreferenceDraftAdjuster {
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

  adjust(item: PreferenceDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPreferenceDraftAdjuster implements PreferenceDraftAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PreferenceDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPreferenceDraftAdjuster implements PreferenceDraftAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PreferenceDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPreferenceDraftAdjuster implements PreferenceDraftAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PreferenceDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelPreferenceDraftAdjuster implements PreferenceDraftAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PreferenceDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the preference draft steps in order and keeps a trace of each. */
export class PreferenceDraftEngine {
  steps: PreferenceDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PreferenceDraft): number {
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

  evaluateAll(items: PreferenceDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPreferenceDraftEngine(flagsValue: flags.Registry): PreferenceDraftEngine {
  return new PreferenceDraftEngine(
    [
      new FlaggedPreferenceDraftAdjuster(flagsValue, "preference-draft-tiered", -4),
      new MinimumPreferenceDraftAdjuster(33.3),
      new TieredPreferenceDraftAdjuster([1878, 3056, 5880], [1.18, 1.09, 1.15]),
      new CapPreferenceDraftAdjuster(1756),
      new LabelPreferenceDraftAdjuster(new Map<string, number>([["south", 0.9], ["central", 0.8]])),
    ],
    [],
    0.1,
    51868.9,
  );
}
