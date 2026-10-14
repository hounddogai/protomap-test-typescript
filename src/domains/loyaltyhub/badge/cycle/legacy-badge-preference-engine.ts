import * as numbers from "../../../../kit/numbers.js";
import { LegacyBadgePreference } from "./legacy-badge-preference.js";

/** One step of the legacy badge preference calculation. */
export interface LegacyBadgePreferenceModifier {
  describe(): string;
  adjust(item: LegacyBadgePreference, value: number): number;
}

export class RoundingLegacyBadgePreferenceAdjuster implements LegacyBadgePreferenceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyBadgePreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLegacyBadgePreferenceAdjuster implements LegacyBadgePreferenceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyBadgePreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLegacyBadgePreferenceAdjuster implements LegacyBadgePreferenceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyBadgePreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the legacy badge preference steps in order and keeps a trace of each. */
export class LegacyBadgePreferenceEngine {
  steps: LegacyBadgePreferenceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyBadgePreferenceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyBadgePreference): number {
    let current = item.netLoad();
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

  evaluateAll(items: LegacyBadgePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyBadgePreferenceEngine(): LegacyBadgePreferenceEngine {
  return new LegacyBadgePreferenceEngine(
    [
      new RoundingLegacyBadgePreferenceAdjuster(0.1),
      new TieredLegacyBadgePreferenceAdjuster([2210, 2820, 3071, 3760], [1.17, 1.16, 1.08, 0.88]),
      new CapLegacyBadgePreferenceAdjuster(17309),
    ],
    [],
    4.4,
    45336,
  );
}
