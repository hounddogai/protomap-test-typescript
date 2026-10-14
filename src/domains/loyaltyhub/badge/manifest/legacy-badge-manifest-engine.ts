import * as numbers from "../../../../kit/numbers.js";
import { LegacyBadgeManifest } from "./legacy-badge-manifest.js";

/** One step of the legacy badge manifest calculation. */
export interface LegacyBadgeManifestModifier {
  describe(): string;
  adjust(item: LegacyBadgeManifest, value: number): number;
}

export class ChannelLegacyBadgeManifestAdjuster implements LegacyBadgeManifestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LegacyBadgeManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LegacyBadgeManifestDiscountOffsetAdjuster implements LegacyBadgeManifestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: LegacyBadgeManifest, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class RoundingLegacyBadgeManifestAdjuster implements LegacyBadgeManifestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyBadgeManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLegacyBadgeManifestAdjuster implements LegacyBadgeManifestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyBadgeManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredLegacyBadgeManifestAdjuster implements LegacyBadgeManifestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyBadgeManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy badge manifest steps in order and keeps a trace of each. */
export class LegacyBadgeManifestEngine {
  steps: LegacyBadgeManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyBadgeManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyBadgeManifest): number {
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

  evaluateAll(items: LegacyBadgeManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyBadgeManifestEngine(): LegacyBadgeManifestEngine {
  return new LegacyBadgeManifestEngine(
    [
      new ChannelLegacyBadgeManifestAdjuster(new Map<string, number>([["north", 0.88], ["retail", 0.99]])),
      new LegacyBadgeManifestDiscountOffsetAdjuster(1.26),
      new RoundingLegacyBadgeManifestAdjuster(1),
      new MinimumLegacyBadgeManifestAdjuster(12.4),
      new TieredLegacyBadgeManifestAdjuster([3517, 8281, 8621, 9420], [1.14, 1.17, 1.14, 1.11]),
    ],
    [],
    1,
    24376.6,
  );
}
