import * as numbers from "../../../../kit/numbers.js";
import { LegacySuppressionDigest } from "./legacy-suppression-digest.js";

/** One step of the legacy suppression digest calculation. */
export interface LegacySuppressionDigestModifier {
  describe(): string;
  adjust(item: LegacySuppressionDigest, value: number): number;
}

export class MinimumLegacySuppressionDigestAdjuster implements LegacySuppressionDigestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacySuppressionDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentLegacySuppressionDigestAdjuster implements LegacySuppressionDigestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacySuppressionDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLegacySuppressionDigestAdjuster implements LegacySuppressionDigestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacySuppressionDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the legacy suppression digest steps in order and keeps a trace of each. */
export class LegacySuppressionDigestEngine {
  steps: LegacySuppressionDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacySuppressionDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacySuppressionDigest): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: LegacySuppressionDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacySuppressionDigestEngine(): LegacySuppressionDigestEngine {
  return new LegacySuppressionDigestEngine(
    [
      new MinimumLegacySuppressionDigestAdjuster(12.5),
      new PercentLegacySuppressionDigestAdjuster(24.1),
      new RoundingLegacySuppressionDigestAdjuster(0.25),
    ],
    [],
    4.3,
    39671.3,
  );
}
