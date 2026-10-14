import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictFrequencyMapping } from "./strict-frequency-mapping.js";

/** One step of the strict frequency mapping calculation. */
export interface StrictFrequencyMappingModifier {
  describe(): string;
  adjust(item: StrictFrequencyMapping, value: number): number;
}

export class RoundingStrictFrequencyMappingAdjuster implements StrictFrequencyMappingModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictFrequencyMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StrictFrequencyMappingBidOffsetAdjuster implements StrictFrequencyMappingModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: StrictFrequencyMapping, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class TieredStrictFrequencyMappingAdjuster implements StrictFrequencyMappingModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictFrequencyMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedStrictFrequencyMappingAdjuster implements StrictFrequencyMappingModifier {
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

  adjust(item: StrictFrequencyMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictFrequencyMappingAdjuster implements StrictFrequencyMappingModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictFrequencyMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the strict frequency mapping steps in order and keeps a trace of each. */
export class StrictFrequencyMappingEngine {
  steps: StrictFrequencyMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictFrequencyMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictFrequencyMapping): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: StrictFrequencyMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictFrequencyMappingEngine(flagsValue: flags.Registry): StrictFrequencyMappingEngine {
  return new StrictFrequencyMappingEngine(
    [
      new RoundingStrictFrequencyMappingAdjuster(0.1),
      new StrictFrequencyMappingBidOffsetAdjuster(1.73),
      new TieredStrictFrequencyMappingAdjuster([4125, 5137, 7263], [0.88, 1.17, 0.94]),
      new FlaggedStrictFrequencyMappingAdjuster(flagsValue, "strict-frequency-mapping-pending", -5.5),
      new MinimumStrictFrequencyMappingAdjuster(48.6),
    ],
    [],
    0.8,
    12239.8,
  );
}
