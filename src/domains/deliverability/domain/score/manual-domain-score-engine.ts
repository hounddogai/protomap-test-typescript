import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualDomainScore } from "./manual-domain-score.js";

/** One step of the manual domain score calculation. */
export interface ManualDomainScoreStep {
  describe(): string;
  adjust(item: ManualDomainScore, value: number): number;
}

export class TieredManualDomainScoreAdjuster implements ManualDomainScoreStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualDomainScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SegmentManualDomainScoreAdjuster implements ManualDomainScoreStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ManualDomainScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedManualDomainScoreAdjuster implements ManualDomainScoreStep {
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

  adjust(item: ManualDomainScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual domain score steps in order and keeps a trace of each. */
export class ManualDomainScoreEngine {
  steps: ManualDomainScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualDomainScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualDomainScore): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ManualDomainScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualDomainScoreEngine(flagsValue: flags.Registry): ManualDomainScoreEngine {
  return new ManualDomainScoreEngine(
    [
      new TieredManualDomainScoreAdjuster([1626, 2579, 5847, 6706], [1, 1.1, 1.05, 1.15]),
      new SegmentManualDomainScoreAdjuster(
        new Map<string, number>([["online", 1.38], ["retail", 1.07], ["central", 0.88]]),
      ),
      new FlaggedManualDomainScoreAdjuster(flagsValue, "manual-domain-score-legacy", -7.7),
    ],
    [],
    4.2,
    38641.2,
  );
}
