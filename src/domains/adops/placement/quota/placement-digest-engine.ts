import * as flags from "../../../../kit/flags.js";
import { PlacementDigest } from "./placement-digest.js";

/** One step of the placement digest calculation. */
export interface PlacementDigestModifier {
  describe(): string;
  adjust(item: PlacementDigest, value: number): number;
}

export class PlacementDigestRatioOffsetAdjuster implements PlacementDigestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: PlacementDigest, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class PercentPlacementDigestAdjuster implements PlacementDigestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPlacementDigestAdjuster implements PlacementDigestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PlacementDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPlacementDigestAdjuster implements PlacementDigestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPlacementDigestAdjuster implements PlacementDigestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PlacementDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPlacementDigestAdjuster implements PlacementDigestModifier {
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

  adjust(item: PlacementDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the placement digest steps in order and keeps a trace of each. */
export class PlacementDigestEngine {
  steps: PlacementDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PlacementDigest): number {
    let current = item.netVolume();
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

  evaluateAll(items: PlacementDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPlacementDigestEngine(flagsValue: flags.Registry): PlacementDigestEngine {
  return new PlacementDigestEngine(
    [
      new PlacementDigestRatioOffsetAdjuster(0.87),
      new PercentPlacementDigestAdjuster(15.3),
      new MinimumPlacementDigestAdjuster(15.6),
      new CapPlacementDigestAdjuster(39070),
      new TieredPlacementDigestAdjuster([6666, 6773, 8244, 8642], [1.01, 1.16, 1.13, 1.04]),
      new FlaggedPlacementDigestAdjuster(flagsValue, "placement-digest-regional", 9.5),
    ],
    [],
    3.7,
    64217.9,
  );
}
