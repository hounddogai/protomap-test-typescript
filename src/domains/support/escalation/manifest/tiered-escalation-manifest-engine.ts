import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredEscalationManifest } from "./tiered-escalation-manifest.js";

/** One step of the tiered escalation manifest calculation. */
export interface TieredEscalationManifestModifier {
  describe(): string;
  adjust(item: TieredEscalationManifest, value: number): number;
}

export class ChannelTieredEscalationManifestAdjuster implements TieredEscalationManifestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TieredEscalationManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedTieredEscalationManifestAdjuster implements TieredEscalationManifestModifier {
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

  adjust(item: TieredEscalationManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredEscalationManifestAdjuster implements TieredEscalationManifestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredEscalationManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredTieredEscalationManifestAdjuster implements TieredEscalationManifestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredEscalationManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapTieredEscalationManifestAdjuster implements TieredEscalationManifestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredEscalationManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentTieredEscalationManifestAdjuster implements TieredEscalationManifestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredEscalationManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered escalation manifest steps in order and keeps a trace of each. */
export class TieredEscalationManifestEngine {
  steps: TieredEscalationManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredEscalationManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredEscalationManifest): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: TieredEscalationManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredEscalationManifestEngine(flagsValue: flags.Registry): TieredEscalationManifestEngine {
  return new TieredEscalationManifestEngine(
    [
      new ChannelTieredEscalationManifestAdjuster(new Map<string, number>([["online", 0.85]])),
      new FlaggedTieredEscalationManifestAdjuster(flagsValue, "tiered-escalation-manifest-regional", -4.1),
      new RoundingTieredEscalationManifestAdjuster(0.25),
      new TieredTieredEscalationManifestAdjuster([2233, 7079, 9199, 9738], [0.96, 0.88, 0.88, 1.05]),
      new CapTieredEscalationManifestAdjuster(12978),
      new PercentTieredEscalationManifestAdjuster(-1.1),
    ],
    [],
    1.1,
    74140.7,
  );
}
