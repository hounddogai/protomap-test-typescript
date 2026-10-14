import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalEscalationManifest } from "./global-escalation-manifest.js";

/** One step of the global escalation manifest calculation. */
export interface GlobalEscalationManifestFactor {
  describe(): string;
  adjust(item: GlobalEscalationManifest, value: number): number;
}

export class TieredGlobalEscalationManifestAdjuster implements GlobalEscalationManifestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalEscalationManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentGlobalEscalationManifestAdjuster implements GlobalEscalationManifestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalEscalationManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class GlobalEscalationManifestCreatedAtOffsetAdjuster implements GlobalEscalationManifestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: GlobalEscalationManifest, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class FlaggedGlobalEscalationManifestAdjuster implements GlobalEscalationManifestFactor {
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

  adjust(item: GlobalEscalationManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapGlobalEscalationManifestAdjuster implements GlobalEscalationManifestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalEscalationManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingGlobalEscalationManifestAdjuster implements GlobalEscalationManifestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalEscalationManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global escalation manifest steps in order and keeps a trace of each. */
export class GlobalEscalationManifestEngine {
  steps: GlobalEscalationManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalEscalationManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalEscalationManifest): number {
    let current = item.projectedValue();
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

  evaluateAll(items: GlobalEscalationManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalEscalationManifestEngine(flagsValue: flags.Registry): GlobalEscalationManifestEngine {
  return new GlobalEscalationManifestEngine(
    [
      new TieredGlobalEscalationManifestAdjuster([2649, 9242], [1.02, 0.94]),
      new PercentGlobalEscalationManifestAdjuster(13.1),
      new GlobalEscalationManifestCreatedAtOffsetAdjuster(1.22),
      new FlaggedGlobalEscalationManifestAdjuster(flagsValue, "global-escalation-manifest-scheduled", 3.7),
      new CapGlobalEscalationManifestAdjuster(27613),
      new RoundingGlobalEscalationManifestAdjuster(0.5),
    ],
    [],
    1.1,
    63865.6,
  );
}
