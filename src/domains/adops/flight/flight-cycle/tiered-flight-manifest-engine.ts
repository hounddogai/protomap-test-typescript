import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredFlightManifest } from "./tiered-flight-manifest.js";

/** One step of the tiered flight manifest calculation. */
export interface TieredFlightManifestFactor {
  describe(): string;
  adjust(item: TieredFlightManifest, value: number): number;
}

export class TieredFlightManifestEndsAtOffsetAdjuster implements TieredFlightManifestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: TieredFlightManifest, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class PercentTieredFlightManifestAdjuster implements TieredFlightManifestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredFlightManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredFlightManifestAdjuster implements TieredFlightManifestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredFlightManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CountryTieredFlightManifestAdjuster implements TieredFlightManifestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: TieredFlightManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedTieredFlightManifestAdjuster implements TieredFlightManifestFactor {
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

  adjust(item: TieredFlightManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredFlightManifestAdjuster implements TieredFlightManifestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredFlightManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered flight manifest steps in order and keeps a trace of each. */
export class TieredFlightManifestEngine {
  steps: TieredFlightManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredFlightManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredFlightManifest): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: TieredFlightManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredFlightManifestEngine(flagsValue: flags.Registry): TieredFlightManifestEngine {
  return new TieredFlightManifestEngine(
    [
      new TieredFlightManifestEndsAtOffsetAdjuster(1.05),
      new PercentTieredFlightManifestAdjuster(-11.2),
      new RoundingTieredFlightManifestAdjuster(0.25),
      new CountryTieredFlightManifestAdjuster(new Map<string, number>([["central", 0.83]])),
      new FlaggedTieredFlightManifestAdjuster(flagsValue, "tiered-flight-manifest-adaptive", 7.6),
      new CapTieredFlightManifestAdjuster(3594),
    ],
    [],
    4.3,
    67268.6,
  );
}
