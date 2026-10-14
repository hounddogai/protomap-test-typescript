import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreativeGroup } from "./creative-group.js";

/** One step of the creative group calculation. */
export interface CreativeGroupStep {
  describe(): string;
  adjust(item: CreativeGroup, value: number): number;
}

export class PercentCreativeGroupAdjuster implements CreativeGroupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreativeGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCreativeGroupAdjuster implements CreativeGroupStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCreativeGroupAdjuster implements CreativeGroupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreativeGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CreativeGroupLimitOffsetAdjuster implements CreativeGroupStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: CreativeGroup, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class TitleCreativeGroupAdjuster implements CreativeGroupStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: CreativeGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedCreativeGroupAdjuster implements CreativeGroupStep {
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

  adjust(item: CreativeGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the creative group steps in order and keeps a trace of each. */
export class CreativeGroupEngine {
  steps: CreativeGroupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeGroupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CreativeGroup): number {
    let current = item.netExposure();
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

  evaluateAll(items: CreativeGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCreativeGroupEngine(flagsValue: flags.Registry): CreativeGroupEngine {
  return new CreativeGroupEngine(
    [
      new PercentCreativeGroupAdjuster(-5.9),
      new RoundingCreativeGroupAdjuster(0.1),
      new MinimumCreativeGroupAdjuster(39.8),
      new CreativeGroupLimitOffsetAdjuster(0.6),
      new TitleCreativeGroupAdjuster(new Map<string, number>([["north", 0.81]])),
      new FlaggedCreativeGroupAdjuster(flagsValue, "creative-group-capped", -9.7),
    ],
    [],
    0.5,
    94164.3,
  );
}
