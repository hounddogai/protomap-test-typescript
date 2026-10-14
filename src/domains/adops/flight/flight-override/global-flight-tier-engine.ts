import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalFlightTier } from "./global-flight-tier.js";

/** One step of the global flight tier calculation. */
export interface GlobalFlightTierModifier {
  describe(): string;
  adjust(item: GlobalFlightTier, value: number): number;
}

export class RoundingGlobalFlightTierAdjuster implements GlobalFlightTierModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalFlightTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedGlobalFlightTierAdjuster implements GlobalFlightTierModifier {
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

  adjust(item: GlobalFlightTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalFlightTierAdjuster implements GlobalFlightTierModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalFlightTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class GlobalFlightTierBatchSizeOffsetAdjuster implements GlobalFlightTierModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: GlobalFlightTier, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

/** Runs the global flight tier steps in order and keeps a trace of each. */
export class GlobalFlightTierEngine {
  steps: GlobalFlightTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalFlightTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalFlightTier): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: GlobalFlightTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalFlightTierEngine(flagsValue: flags.Registry): GlobalFlightTierEngine {
  return new GlobalFlightTierEngine(
    [
      new RoundingGlobalFlightTierAdjuster(0.5),
      new FlaggedGlobalFlightTierAdjuster(flagsValue, "global-flight-tier-seasonal", 1.2),
      new TieredGlobalFlightTierAdjuster([6447, 7437], [1.11, 0.94]),
      new GlobalFlightTierBatchSizeOffsetAdjuster(1.46),
    ],
    [],
    0.9,
    42062.6,
  );
}
