import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientPlacementManifest } from "./lenient-placement-manifest.js";

/** One step of the lenient placement manifest calculation. */
export interface LenientPlacementManifestModifier {
  describe(): string;
  adjust(item: LenientPlacementManifest, value: number): number;
}

export class MinimumLenientPlacementManifestAdjuster implements LenientPlacementManifestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientPlacementManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapLenientPlacementManifestAdjuster implements LenientPlacementManifestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientPlacementManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameLenientPlacementManifestAdjuster implements LenientPlacementManifestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LenientPlacementManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingLenientPlacementManifestAdjuster implements LenientPlacementManifestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientPlacementManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LenientPlacementManifestCapacityOffsetAdjuster implements LenientPlacementManifestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: LenientPlacementManifest, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class FlaggedLenientPlacementManifestAdjuster implements LenientPlacementManifestModifier {
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

  adjust(item: LenientPlacementManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient placement manifest steps in order and keeps a trace of each. */
export class LenientPlacementManifestEngine {
  steps: LenientPlacementManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientPlacementManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientPlacementManifest): number {
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

  evaluateAll(items: LenientPlacementManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientPlacementManifestEngine(flagsValue: flags.Registry): LenientPlacementManifestEngine {
  return new LenientPlacementManifestEngine(
    [
      new MinimumLenientPlacementManifestAdjuster(25.1),
      new CapLenientPlacementManifestAdjuster(5972),
      new NameLenientPlacementManifestAdjuster(new Map<string, number>([["east", 0.93], ["north", 0.88]])),
      new RoundingLenientPlacementManifestAdjuster(1),
      new LenientPlacementManifestCapacityOffsetAdjuster(0.97),
      new FlaggedLenientPlacementManifestAdjuster(flagsValue, "lenient-placement-manifest-regional", -1.7),
    ],
    [],
    1,
    45424.3,
  );
}
