import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalComplaintManifest } from "./regional-complaint-manifest.js";

/** One step of the regional complaint manifest calculation. */
export interface RegionalComplaintManifestModifier {
  describe(): string;
  adjust(item: RegionalComplaintManifest, value: number): number;
}

export class ChannelRegionalComplaintManifestAdjuster implements RegionalComplaintManifestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RegionalComplaintManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RegionalComplaintManifestMarginOffsetAdjuster implements RegionalComplaintManifestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: RegionalComplaintManifest, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class MinimumRegionalComplaintManifestAdjuster implements RegionalComplaintManifestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalComplaintManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRegionalComplaintManifestAdjuster implements RegionalComplaintManifestModifier {
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

  adjust(item: RegionalComplaintManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRegionalComplaintManifestAdjuster implements RegionalComplaintManifestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalComplaintManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the regional complaint manifest steps in order and keeps a trace of each. */
export class RegionalComplaintManifestEngine {
  steps: RegionalComplaintManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalComplaintManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalComplaintManifest): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: RegionalComplaintManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalComplaintManifestEngine(flagsValue: flags.Registry): RegionalComplaintManifestEngine {
  return new RegionalComplaintManifestEngine(
    [
      new ChannelRegionalComplaintManifestAdjuster(new Map<string, number>([["east", 0.93], ["central", 0.76]])),
      new RegionalComplaintManifestMarginOffsetAdjuster(0.53),
      new MinimumRegionalComplaintManifestAdjuster(40.5),
      new FlaggedRegionalComplaintManifestAdjuster(flagsValue, "regional-complaint-manifest-regional", 1.5),
      new CapRegionalComplaintManifestAdjuster(33318),
    ],
    [],
    4.4,
    46577.8,
  );
}
