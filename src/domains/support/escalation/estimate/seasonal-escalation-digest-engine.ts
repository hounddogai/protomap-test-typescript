import * as numbers from "../../../../kit/numbers.js";
import { SeasonalEscalationDigest } from "./seasonal-escalation-digest.js";

/** One step of the seasonal escalation digest calculation. */
export interface SeasonalEscalationDigestAdjuster {
  describe(): string;
  adjust(item: SeasonalEscalationDigest, value: number): number;
}

export class PercentSeasonalEscalationDigestAdjuster implements SeasonalEscalationDigestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalEscalationDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalEscalationDigestAdjuster implements SeasonalEscalationDigestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalEscalationDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SegmentSeasonalEscalationDigestAdjuster implements SeasonalEscalationDigestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: SeasonalEscalationDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class SeasonalEscalationDigestDiscountOffsetAdjuster implements SeasonalEscalationDigestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: SeasonalEscalationDigest, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class RoundingSeasonalEscalationDigestAdjuster implements SeasonalEscalationDigestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalEscalationDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal escalation digest steps in order and keeps a trace of each. */
export class SeasonalEscalationDigestEngine {
  steps: SeasonalEscalationDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalEscalationDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalEscalationDigest): number {
    let current = item.netExposure();
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

  evaluateAll(items: SeasonalEscalationDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalEscalationDigestEngine(): SeasonalEscalationDigestEngine {
  return new SeasonalEscalationDigestEngine(
    [
      new PercentSeasonalEscalationDigestAdjuster(-14.1),
      new MinimumSeasonalEscalationDigestAdjuster(11.9),
      new SegmentSeasonalEscalationDigestAdjuster(
        new Map<string, number>([["west", 1.27], ["south", 1.3], ["central", 0.71]]),
      ),
      new SeasonalEscalationDigestDiscountOffsetAdjuster(1.33),
      new RoundingSeasonalEscalationDigestAdjuster(0.5),
    ],
    [],
    4.2,
    17363.8,
  );
}
