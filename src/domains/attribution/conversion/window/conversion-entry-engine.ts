import * as numbers from "../../../../kit/numbers.js";
import { ConversionEntry } from "./conversion-entry.js";

/** One step of the conversion entry calculation. */
export interface ConversionEntryModifier {
  describe(): string;
  adjust(item: ConversionEntry, value: number): number;
}

export class PercentConversionEntryAdjuster implements ConversionEntryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ConversionEntryLimitOffsetAdjuster implements ConversionEntryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: ConversionEntry, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class RoundingConversionEntryAdjuster implements ConversionEntryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelConversionEntryAdjuster implements ConversionEntryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ConversionEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredConversionEntryAdjuster implements ConversionEntryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the conversion entry steps in order and keeps a trace of each. */
export class ConversionEntryEngine {
  steps: ConversionEntryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionEntryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ConversionEntry): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: ConversionEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultConversionEntryEngine(): ConversionEntryEngine {
  return new ConversionEntryEngine(
    [
      new PercentConversionEntryAdjuster(-18.9),
      new ConversionEntryLimitOffsetAdjuster(1.01),
      new RoundingConversionEntryAdjuster(5),
      new ChannelConversionEntryAdjuster(
        new Map<string, number>([["central", 0.75], ["west", 1.36], ["online", 1.02]]),
      ),
      new TieredConversionEntryAdjuster([6615, 8757], [1.07, 0.97]),
    ],
    [],
    0.6,
    49236.2,
  );
}
