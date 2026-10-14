import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientConversionAudit } from "./lenient-conversion-audit.js";

/** One step of the lenient conversion audit calculation. */
export interface LenientConversionAuditStep {
  describe(): string;
  adjust(item: LenientConversionAudit, value: number): number;
}

export class FlaggedLenientConversionAuditAdjuster implements LenientConversionAuditStep {
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

  adjust(item: LenientConversionAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientConversionAuditAdjuster implements LenientConversionAuditStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientConversionAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLenientConversionAuditAdjuster implements LenientConversionAuditStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientConversionAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentLenientConversionAuditAdjuster implements LenientConversionAuditStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientConversionAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientConversionAuditAdjuster implements LenientConversionAuditStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientConversionAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SegmentLenientConversionAuditAdjuster implements LenientConversionAuditStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: LenientConversionAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the lenient conversion audit steps in order and keeps a trace of each. */
export class LenientConversionAuditEngine {
  steps: LenientConversionAuditStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientConversionAuditStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientConversionAudit): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: LenientConversionAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientConversionAuditEngine(flagsValue: flags.Registry): LenientConversionAuditEngine {
  return new LenientConversionAuditEngine(
    [
      new FlaggedLenientConversionAuditAdjuster(flagsValue, "lenient-conversion-audit-rolling", 0.3),
      new RoundingLenientConversionAuditAdjuster(0.5),
      new MinimumLenientConversionAuditAdjuster(1),
      new PercentLenientConversionAuditAdjuster(7.4),
      new TieredLenientConversionAuditAdjuster([4591, 5787], [0.88, 0.8]),
      new SegmentLenientConversionAuditAdjuster(
        new Map<string, number>([["west", 0.77], ["central", 1.05], ["north", 1.14]]),
      ),
    ],
    [],
    1,
    94343.8,
  );
}
