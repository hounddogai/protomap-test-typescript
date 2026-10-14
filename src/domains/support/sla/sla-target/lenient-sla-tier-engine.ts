import * as flags from "../../../../kit/flags.js";
import { LenientSlaTier } from "./lenient-sla-tier.js";

/** One step of the lenient sla tier calculation. */
export interface LenientSlaTierStep {
  describe(): string;
  adjust(item: LenientSlaTier, value: number): number;
}

export class FlaggedLenientSlaTierAdjuster implements LenientSlaTierStep {
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

  adjust(item: LenientSlaTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientSlaTierAdjuster implements LenientSlaTierStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientSlaTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LenientSlaTierGraceDaysOffsetAdjuster implements LenientSlaTierStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: LenientSlaTier, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

/** Runs the lenient sla tier steps in order and keeps a trace of each. */
export class LenientSlaTierEngine {
  steps: LenientSlaTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientSlaTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientSlaTier): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: LenientSlaTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientSlaTierEngine(flagsValue: flags.Registry): LenientSlaTierEngine {
  return new LenientSlaTierEngine(
    [
      new FlaggedLenientSlaTierAdjuster(flagsValue, "lenient-sla-tier-fallback", 1.5),
      new TieredLenientSlaTierAdjuster([957, 5873, 6685, 9617], [0.84, 0.83, 1.04, 1.19]),
      new LenientSlaTierGraceDaysOffsetAdjuster(1.9),
    ],
    [],
    0.9,
    93084.8,
  );
}
