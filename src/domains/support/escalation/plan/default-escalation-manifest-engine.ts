import * as flags from "../../../../kit/flags.js";
import { DefaultEscalationManifest } from "./default-escalation-manifest.js";

/** One step of the default escalation manifest calculation. */
export interface DefaultEscalationManifestModifier {
  describe(): string;
  adjust(item: DefaultEscalationManifest, value: number): number;
}

export class MinimumDefaultEscalationManifestAdjuster implements DefaultEscalationManifestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultEscalationManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapDefaultEscalationManifestAdjuster implements DefaultEscalationManifestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultEscalationManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentDefaultEscalationManifestAdjuster implements DefaultEscalationManifestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultEscalationManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedDefaultEscalationManifestAdjuster implements DefaultEscalationManifestModifier {
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

  adjust(item: DefaultEscalationManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredDefaultEscalationManifestAdjuster implements DefaultEscalationManifestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultEscalationManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the default escalation manifest steps in order and keeps a trace of each. */
export class DefaultEscalationManifestEngine {
  steps: DefaultEscalationManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultEscalationManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultEscalationManifest): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: DefaultEscalationManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultEscalationManifestEngine(flagsValue: flags.Registry): DefaultEscalationManifestEngine {
  return new DefaultEscalationManifestEngine(
    [
      new MinimumDefaultEscalationManifestAdjuster(6),
      new CapDefaultEscalationManifestAdjuster(7239),
      new PercentDefaultEscalationManifestAdjuster(8.6),
      new FlaggedDefaultEscalationManifestAdjuster(flagsValue, "default-escalation-manifest-tiered", -3),
      new TieredDefaultEscalationManifestAdjuster([2883, 3190, 5602], [0.87, 0.93, 1.15]),
    ],
    [],
    4.6,
    37163.7,
  );
}
