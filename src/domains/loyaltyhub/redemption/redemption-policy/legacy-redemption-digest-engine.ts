import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyRedemptionDigest } from "./legacy-redemption-digest.js";

/** One step of the legacy redemption digest calculation. */
export interface LegacyRedemptionDigestAdjuster {
  describe(): string;
  adjust(item: LegacyRedemptionDigest, value: number): number;
}

export class PercentLegacyRedemptionDigestAdjuster implements LegacyRedemptionDigestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyRedemptionDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedLegacyRedemptionDigestAdjuster implements LegacyRedemptionDigestAdjuster {
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

  adjust(item: LegacyRedemptionDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLegacyRedemptionDigestAdjuster implements LegacyRedemptionDigestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyRedemptionDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the legacy redemption digest steps in order and keeps a trace of each. */
export class LegacyRedemptionDigestEngine {
  steps: LegacyRedemptionDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyRedemptionDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyRedemptionDigest): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: LegacyRedemptionDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyRedemptionDigestEngine(flagsValue: flags.Registry): LegacyRedemptionDigestEngine {
  return new LegacyRedemptionDigestEngine(
    [
      new PercentLegacyRedemptionDigestAdjuster(-23.7),
      new FlaggedLegacyRedemptionDigestAdjuster(flagsValue, "legacy-redemption-digest-primary", 9.2),
      new CapLegacyRedemptionDigestAdjuster(9137),
    ],
    [],
    2,
    93421.3,
  );
}
