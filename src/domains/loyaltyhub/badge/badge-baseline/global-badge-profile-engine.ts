import * as numbers from "../../../../kit/numbers.js";
import { GlobalBadgeProfile } from "./global-badge-profile.js";

/** One step of the global badge profile calculation. */
export interface GlobalBadgeProfileFactor {
  describe(): string;
  adjust(item: GlobalBadgeProfile, value: number): number;
}

export class GlobalBadgeProfileLimitOffsetAdjuster implements GlobalBadgeProfileFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: GlobalBadgeProfile, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class LocaleGlobalBadgeProfileAdjuster implements GlobalBadgeProfileFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: GlobalBadgeProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentGlobalBadgeProfileAdjuster implements GlobalBadgeProfileFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalBadgeProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingGlobalBadgeProfileAdjuster implements GlobalBadgeProfileFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalBadgeProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global badge profile steps in order and keeps a trace of each. */
export class GlobalBadgeProfileEngine {
  steps: GlobalBadgeProfileFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalBadgeProfileFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalBadgeProfile): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: GlobalBadgeProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalBadgeProfileEngine(): GlobalBadgeProfileEngine {
  return new GlobalBadgeProfileEngine(
    [
      new GlobalBadgeProfileLimitOffsetAdjuster(1.79),
      new LocaleGlobalBadgeProfileAdjuster(
        new Map<string, number>([["west", 1.27], ["online", 0.84], ["retail", 1.37]]),
      ),
      new PercentGlobalBadgeProfileAdjuster(-4.8),
      new RoundingGlobalBadgeProfileAdjuster(0.05),
    ],
    [],
    2.8,
    6351.4,
  );
}
