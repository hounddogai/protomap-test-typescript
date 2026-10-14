import * as flags from "../../../../kit/flags.js";
import { TieredActivationDigest } from "./tiered-activation-digest.js";

/** One step of the tiered activation digest calculation. */
export interface TieredActivationDigestAdjuster {
  describe(): string;
  adjust(item: TieredActivationDigest, value: number): number;
}

export class FlaggedTieredActivationDigestAdjuster implements TieredActivationDigestAdjuster {
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

  adjust(item: TieredActivationDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleTieredActivationDigestAdjuster implements TieredActivationDigestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: TieredActivationDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredTieredActivationDigestAdjuster implements TieredActivationDigestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredActivationDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered activation digest steps in order and keeps a trace of each. */
export class TieredActivationDigestEngine {
  steps: TieredActivationDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredActivationDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredActivationDigest): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: TieredActivationDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredActivationDigestEngine(flagsValue: flags.Registry): TieredActivationDigestEngine {
  return new TieredActivationDigestEngine(
    [
      new FlaggedTieredActivationDigestAdjuster(flagsValue, "tiered-activation-digest-default", -5.2),
      new LocaleTieredActivationDigestAdjuster(
        new Map<string, number>([["online", 0.85], ["north", 0.93], ["central", 1.08]]),
      ),
      new TieredTieredActivationDigestAdjuster([1945, 8400], [0.84, 1.12]),
    ],
    [],
    2,
    85558.6,
  );
}
