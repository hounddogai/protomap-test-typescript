import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingProofManifest } from "./rolling-proof-manifest.js";

/** One step of the rolling proof manifest calculation. */
export interface RollingProofManifestFactor {
  describe(): string;
  adjust(item: RollingProofManifest, value: number): number;
}

export class CapRollingProofManifestAdjuster implements RollingProofManifestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingProofManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingRollingProofManifestAdjuster implements RollingProofManifestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingProofManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRollingProofManifestAdjuster implements RollingProofManifestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingProofManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRollingProofManifestAdjuster implements RollingProofManifestFactor {
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

  adjust(item: RollingProofManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameRollingProofManifestAdjuster implements RollingProofManifestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RollingProofManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling proof manifest steps in order and keeps a trace of each. */
export class RollingProofManifestEngine {
  steps: RollingProofManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingProofManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingProofManifest): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: RollingProofManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingProofManifestEngine(flagsValue: flags.Registry): RollingProofManifestEngine {
  return new RollingProofManifestEngine(
    [
      new CapRollingProofManifestAdjuster(1833),
      new RoundingRollingProofManifestAdjuster(1),
      new MinimumRollingProofManifestAdjuster(35.2),
      new FlaggedRollingProofManifestAdjuster(flagsValue, "rolling-proof-manifest-lenient", 0.8),
      new NameRollingProofManifestAdjuster(new Map<string, number>([["retail", 1.39], ["south", 0.75]])),
    ],
    [],
    4.4,
    84165.3,
  );
}
