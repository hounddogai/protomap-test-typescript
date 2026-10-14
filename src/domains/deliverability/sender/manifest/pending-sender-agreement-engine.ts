import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingSenderAgreement } from "./pending-sender-agreement.js";

/** One step of the pending sender agreement calculation. */
export interface PendingSenderAgreementAdjuster {
  describe(): string;
  adjust(item: PendingSenderAgreement, value: number): number;
}

export class CategoryPendingSenderAgreementAdjuster implements PendingSenderAgreementAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: PendingSenderAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPendingSenderAgreementAdjuster implements PendingSenderAgreementAdjuster {
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

  adjust(item: PendingSenderAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingSenderAgreementAdjuster implements PendingSenderAgreementAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingSenderAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPendingSenderAgreementAdjuster implements PendingSenderAgreementAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingSenderAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PendingSenderAgreementBudgetOffsetAdjuster implements PendingSenderAgreementAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: PendingSenderAgreement, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class MinimumPendingSenderAgreementAdjuster implements PendingSenderAgreementAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingSenderAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pending sender agreement steps in order and keeps a trace of each. */
export class PendingSenderAgreementEngine {
  steps: PendingSenderAgreementAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingSenderAgreementAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingSenderAgreement): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PendingSenderAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingSenderAgreementEngine(flagsValue: flags.Registry): PendingSenderAgreementEngine {
  return new PendingSenderAgreementEngine(
    [
      new CategoryPendingSenderAgreementAdjuster(new Map<string, number>([["retail", 0.81], ["east", 0.92]])),
      new FlaggedPendingSenderAgreementAdjuster(flagsValue, "pending-sender-agreement-lenient", -0.6),
      new CapPendingSenderAgreementAdjuster(27875),
      new TieredPendingSenderAgreementAdjuster([2343, 5122], [1, 1.13]),
      new PendingSenderAgreementBudgetOffsetAdjuster(1.69),
      new MinimumPendingSenderAgreementAdjuster(24.6),
    ],
    [],
    4.6,
    26557.5,
  );
}
