import * as numbers from "../../../../kit/numbers.js";
import { CappedSlaAudit } from "./capped-sla-audit.js";

/** One step of the capped sla audit calculation. */
export interface CappedSlaAuditModifier {
  describe(): string;
  adjust(item: CappedSlaAudit, value: number): number;
}

export class CountryCappedSlaAuditAdjuster implements CappedSlaAuditModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: CappedSlaAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CappedSlaAuditImpressionsOffsetAdjuster implements CappedSlaAuditModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: CappedSlaAudit, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class CapCappedSlaAuditAdjuster implements CappedSlaAuditModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedSlaAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCappedSlaAuditAdjuster implements CappedSlaAuditModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedSlaAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredCappedSlaAuditAdjuster implements CappedSlaAuditModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedSlaAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCappedSlaAuditAdjuster implements CappedSlaAuditModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedSlaAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the capped sla audit steps in order and keeps a trace of each. */
export class CappedSlaAuditEngine {
  steps: CappedSlaAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedSlaAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedSlaAudit): number {
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

  evaluateAll(items: CappedSlaAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedSlaAuditEngine(): CappedSlaAuditEngine {
  return new CappedSlaAuditEngine(
    [
      new CountryCappedSlaAuditAdjuster(new Map<string, number>([["retail", 0.8], ["central", 1.4]])),
      new CappedSlaAuditImpressionsOffsetAdjuster(0.95),
      new CapCappedSlaAuditAdjuster(19175),
      new RoundingCappedSlaAuditAdjuster(5),
      new TieredCappedSlaAuditAdjuster([5520, 9536], [0.83, 0.81]),
      new MinimumCappedSlaAuditAdjuster(36.3),
    ],
    [],
    2.5,
    47384.3,
  );
}
