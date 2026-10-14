import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ConversionDraft } from "./conversion-draft.js";

/** One step of the conversion draft calculation. */
export interface ConversionDraftAdjuster {
  describe(): string;
  adjust(item: ConversionDraft, value: number): number;
}

export class FlaggedConversionDraftAdjuster implements ConversionDraftAdjuster {
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

  adjust(item: ConversionDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ConversionDraftBudgetOffsetAdjuster implements ConversionDraftAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ConversionDraft, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class MinimumConversionDraftAdjuster implements ConversionDraftAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ConversionDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredConversionDraftAdjuster implements ConversionDraftAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapConversionDraftAdjuster implements ConversionDraftAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the conversion draft steps in order and keeps a trace of each. */
export class ConversionDraftEngine {
  steps: ConversionDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ConversionDraft): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ConversionDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultConversionDraftEngine(flagsValue: flags.Registry): ConversionDraftEngine {
  return new ConversionDraftEngine(
    [
      new FlaggedConversionDraftAdjuster(flagsValue, "conversion-draft-capped", 0.9),
      new ConversionDraftBudgetOffsetAdjuster(0.43),
      new MinimumConversionDraftAdjuster(34.2),
      new TieredConversionDraftAdjuster([3341, 5176, 7425, 9295], [0.89, 1.08, 1.07, 0.97]),
      new CapConversionDraftAdjuster(1600),
    ],
    [],
    3.9,
    1255,
  );
}
