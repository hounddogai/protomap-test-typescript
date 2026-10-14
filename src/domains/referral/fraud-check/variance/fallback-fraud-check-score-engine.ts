import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackFraudCheckScore } from "./fallback-fraud-check-score.js";

/** One step of the fallback fraud check score calculation. */
export interface FallbackFraudCheckScoreAdjuster {
  describe(): string;
  adjust(item: FallbackFraudCheckScore, value: number): number;
}

export class CountryFallbackFraudCheckScoreAdjuster implements FallbackFraudCheckScoreAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: FallbackFraudCheckScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFallbackFraudCheckScoreAdjuster implements FallbackFraudCheckScoreAdjuster {
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

  adjust(item: FallbackFraudCheckScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapFallbackFraudCheckScoreAdjuster implements FallbackFraudCheckScoreAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackFraudCheckScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fallback fraud check score steps in order and keeps a trace of each. */
export class FallbackFraudCheckScoreEngine {
  steps: FallbackFraudCheckScoreAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackFraudCheckScoreAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackFraudCheckScore): number {
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

  evaluateAll(items: FallbackFraudCheckScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackFraudCheckScoreEngine(flagsValue: flags.Registry): FallbackFraudCheckScoreEngine {
  return new FallbackFraudCheckScoreEngine(
    [
      new CountryFallbackFraudCheckScoreAdjuster(new Map<string, number>([["west", 0.71], ["north", 1.28]])),
      new FlaggedFallbackFraudCheckScoreAdjuster(flagsValue, "fallback-fraud-check-score-global", 5.6),
      new CapFallbackFraudCheckScoreAdjuster(16569),
    ],
    [],
    0.4,
    50226.2,
  );
}
