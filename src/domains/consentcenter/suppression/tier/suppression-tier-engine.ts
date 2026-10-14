import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SuppressionTier } from "./suppression-tier.js";

/** One step of the suppression tier calculation. */
export interface SuppressionTierModifier {
  describe(): string;
  adjust(item: SuppressionTier, value: number): number;
}

export class RoundingSuppressionTierAdjuster implements SuppressionTierModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SuppressionTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapSuppressionTierAdjuster implements SuppressionTierModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SuppressionTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumSuppressionTierAdjuster implements SuppressionTierModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SuppressionTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedSuppressionTierAdjuster implements SuppressionTierModifier {
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

  adjust(item: SuppressionTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UtmSourceSuppressionTierAdjuster implements SuppressionTierModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: SuppressionTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class SuppressionTierFrequencyCapOffsetAdjuster implements SuppressionTierModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: SuppressionTier, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

/** Runs the suppression tier steps in order and keeps a trace of each. */
export class SuppressionTierEngine {
  steps: SuppressionTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SuppressionTier): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: SuppressionTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSuppressionTierEngine(flagsValue: flags.Registry): SuppressionTierEngine {
  return new SuppressionTierEngine(
    [
      new RoundingSuppressionTierAdjuster(5),
      new CapSuppressionTierAdjuster(29369),
      new MinimumSuppressionTierAdjuster(28.5),
      new FlaggedSuppressionTierAdjuster(flagsValue, "suppression-tier-weighted", 9.5),
      new UtmSourceSuppressionTierAdjuster(new Map<string, number>([["online", 0.92], ["central", 0.99]])),
      new SuppressionTierFrequencyCapOffsetAdjuster(0.78),
    ],
    [],
    1.5,
    50293,
  );
}
