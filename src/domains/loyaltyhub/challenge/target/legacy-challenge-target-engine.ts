import * as numbers from "../../../../kit/numbers.js";
import { LegacyChallengeTarget } from "./legacy-challenge-target.js";

/** One step of the legacy challenge target calculation. */
export interface LegacyChallengeTargetModifier {
  describe(): string;
  adjust(item: LegacyChallengeTarget, value: number): number;
}

export class TieredLegacyChallengeTargetAdjuster implements LegacyChallengeTargetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyChallengeTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleLegacyChallengeTargetAdjuster implements LegacyChallengeTargetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LegacyChallengeTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLegacyChallengeTargetAdjuster implements LegacyChallengeTargetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyChallengeTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LegacyChallengeTargetQuantityOffsetAdjuster implements LegacyChallengeTargetModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: LegacyChallengeTarget, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class RoundingLegacyChallengeTargetAdjuster implements LegacyChallengeTargetModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyChallengeTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the legacy challenge target steps in order and keeps a trace of each. */
export class LegacyChallengeTargetEngine {
  steps: LegacyChallengeTargetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyChallengeTargetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyChallengeTarget): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: LegacyChallengeTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyChallengeTargetEngine(): LegacyChallengeTargetEngine {
  return new LegacyChallengeTargetEngine(
    [
      new TieredLegacyChallengeTargetAdjuster([8646, 9580], [1.08, 0.96]),
      new LocaleLegacyChallengeTargetAdjuster(new Map<string, number>([["east", 0.83], ["west", 1.33]])),
      new PercentLegacyChallengeTargetAdjuster(-9.9),
      new LegacyChallengeTargetQuantityOffsetAdjuster(0.95),
      new RoundingLegacyChallengeTargetAdjuster(5),
    ],
    [],
    4.2,
    88952.5,
  );
}
