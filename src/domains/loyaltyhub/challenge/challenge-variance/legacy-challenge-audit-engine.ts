import * as numbers from "../../../../kit/numbers.js";
import { LegacyChallengeAudit } from "./legacy-challenge-audit.js";

/** One step of the legacy challenge audit calculation. */
export interface LegacyChallengeAuditModifier {
  describe(): string;
  adjust(item: LegacyChallengeAudit, value: number): number;
}

export class CapLegacyChallengeAuditAdjuster implements LegacyChallengeAuditModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyChallengeAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLegacyChallengeAuditAdjuster implements LegacyChallengeAuditModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyChallengeAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLegacyChallengeAuditAdjuster implements LegacyChallengeAuditModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyChallengeAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionLegacyChallengeAuditAdjuster implements LegacyChallengeAuditModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: LegacyChallengeAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the legacy challenge audit steps in order and keeps a trace of each. */
export class LegacyChallengeAuditEngine {
  steps: LegacyChallengeAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyChallengeAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyChallengeAudit): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: LegacyChallengeAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyChallengeAuditEngine(): LegacyChallengeAuditEngine {
  return new LegacyChallengeAuditEngine(
    [
      new CapLegacyChallengeAuditAdjuster(10832),
      new RoundingLegacyChallengeAuditAdjuster(5),
      new MinimumLegacyChallengeAuditAdjuster(28),
      new RegionLegacyChallengeAuditAdjuster(
        new Map<string, number>([["south", 1.24], ["east", 0.78], ["north", 1.14]]),
      ),
    ],
    [],
    1.9,
    17556.9,
  );
}
