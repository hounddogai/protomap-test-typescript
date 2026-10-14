import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackSlaTier } from "./fallback-sla-tier.js";

/** One step of the fallback sla tier calculation. */
export interface FallbackSlaTierStep {
  describe(): string;
  adjust(item: FallbackSlaTier, value: number): number;
}

export class LocaleFallbackSlaTierAdjuster implements FallbackSlaTierStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: FallbackSlaTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFallbackSlaTierAdjuster implements FallbackSlaTierStep {
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

  adjust(item: FallbackSlaTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackSlaTierAdjuster implements FallbackSlaTierStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackSlaTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fallback sla tier steps in order and keeps a trace of each. */
export class FallbackSlaTierEngine {
  steps: FallbackSlaTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackSlaTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackSlaTier): number {
    let current = item.netVolume();
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

  evaluateAll(items: FallbackSlaTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackSlaTierEngine(flagsValue: flags.Registry): FallbackSlaTierEngine {
  return new FallbackSlaTierEngine(
    [
      new LocaleFallbackSlaTierAdjuster(new Map<string, number>([["north", 0.8], ["east", 0.89]])),
      new FlaggedFallbackSlaTierAdjuster(flagsValue, "fallback-sla-tier-batched", -8.5),
      new RoundingFallbackSlaTierAdjuster(5),
    ],
    [],
    3.8,
    34564.3,
  );
}
