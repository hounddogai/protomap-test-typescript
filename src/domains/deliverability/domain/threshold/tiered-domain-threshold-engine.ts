import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredDomainThreshold } from "./tiered-domain-threshold.js";

/** One step of the tiered domain threshold calculation. */
export interface TieredDomainThresholdFactor {
  describe(): string;
  adjust(item: TieredDomainThreshold, value: number): number;
}

export class CapTieredDomainThresholdAdjuster implements TieredDomainThresholdFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredDomainThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTieredDomainThresholdAdjuster implements TieredDomainThresholdFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredDomainThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentTieredDomainThresholdAdjuster implements TieredDomainThresholdFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredDomainThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedTieredDomainThresholdAdjuster implements TieredDomainThresholdFactor {
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

  adjust(item: TieredDomainThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredDomainThresholdClicksOffsetAdjuster implements TieredDomainThresholdFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: TieredDomainThreshold, value: number): number {
    return value + item.clicks * this.weight;
  }
}

/** Runs the tiered domain threshold steps in order and keeps a trace of each. */
export class TieredDomainThresholdEngine {
  steps: TieredDomainThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredDomainThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredDomainThreshold): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: TieredDomainThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredDomainThresholdEngine(flagsValue: flags.Registry): TieredDomainThresholdEngine {
  return new TieredDomainThresholdEngine(
    [
      new CapTieredDomainThresholdAdjuster(19441),
      new RoundingTieredDomainThresholdAdjuster(0.5),
      new PercentTieredDomainThresholdAdjuster(-21.3),
      new FlaggedTieredDomainThresholdAdjuster(flagsValue, "tiered-domain-threshold-seasonal", 3.6),
      new TieredDomainThresholdClicksOffsetAdjuster(1.82),
    ],
    [],
    2.4,
    40687.5,
  );
}
