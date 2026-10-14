import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryJourneyAudit } from "./primary-journey-audit.js";

/** One step of the primary journey audit calculation. */
export interface PrimaryJourneyAuditModifier {
  describe(): string;
  adjust(item: PrimaryJourneyAudit, value: number): number;
}

export class FlaggedPrimaryJourneyAuditAdjuster implements PrimaryJourneyAuditModifier {
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

  adjust(item: PrimaryJourneyAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryJourneyAuditEndsAtOffsetAdjuster implements PrimaryJourneyAuditModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: PrimaryJourneyAudit, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class LabelPrimaryJourneyAuditAdjuster implements PrimaryJourneyAuditModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PrimaryJourneyAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPrimaryJourneyAuditAdjuster implements PrimaryJourneyAuditModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryJourneyAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPrimaryJourneyAuditAdjuster implements PrimaryJourneyAuditModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryJourneyAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPrimaryJourneyAuditAdjuster implements PrimaryJourneyAuditModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryJourneyAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the primary journey audit steps in order and keeps a trace of each. */
export class PrimaryJourneyAuditEngine {
  steps: PrimaryJourneyAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryJourneyAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryJourneyAudit): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: PrimaryJourneyAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryJourneyAuditEngine(flagsValue: flags.Registry): PrimaryJourneyAuditEngine {
  return new PrimaryJourneyAuditEngine(
    [
      new FlaggedPrimaryJourneyAuditAdjuster(flagsValue, "primary-journey-audit-seasonal", -4.3),
      new PrimaryJourneyAuditEndsAtOffsetAdjuster(1.23),
      new LabelPrimaryJourneyAuditAdjuster(new Map<string, number>([["central", 1.06]])),
      new TieredPrimaryJourneyAuditAdjuster([45, 348, 6362, 8100], [0.98, 1.03, 0.93, 0.82]),
      new CapPrimaryJourneyAuditAdjuster(14320),
      new MinimumPrimaryJourneyAuditAdjuster(45.2),
    ],
    [],
    4,
    95082.1,
  );
}
