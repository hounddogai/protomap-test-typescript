import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyEscalationLedger } from "./legacy-escalation-ledger.js";

/** One step of the legacy escalation ledger calculation. */
export interface LegacyEscalationLedgerModifier {
  describe(): string;
  adjust(item: LegacyEscalationLedger, value: number): number;
}

export class SourceLegacyEscalationLedgerAdjuster implements LegacyEscalationLedgerModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: LegacyEscalationLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingLegacyEscalationLedgerAdjuster implements LegacyEscalationLedgerModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyEscalationLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLegacyEscalationLedgerAdjuster implements LegacyEscalationLedgerModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyEscalationLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredLegacyEscalationLedgerAdjuster implements LegacyEscalationLedgerModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyEscalationLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedLegacyEscalationLedgerAdjuster implements LegacyEscalationLedgerModifier {
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

  adjust(item: LegacyEscalationLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy escalation ledger steps in order and keeps a trace of each. */
export class LegacyEscalationLedgerEngine {
  steps: LegacyEscalationLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyEscalationLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyEscalationLedger): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: LegacyEscalationLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyEscalationLedgerEngine(flagsValue: flags.Registry): LegacyEscalationLedgerEngine {
  return new LegacyEscalationLedgerEngine(
    [
      new SourceLegacyEscalationLedgerAdjuster(new Map<string, number>([["online", 1.1], ["retail", 0.8]])),
      new RoundingLegacyEscalationLedgerAdjuster(0.1),
      new MinimumLegacyEscalationLedgerAdjuster(40.6),
      new TieredLegacyEscalationLedgerAdjuster([1165, 1351, 4548, 7418], [0.92, 1.06, 0.92, 0.88]),
      new FlaggedLegacyEscalationLedgerAdjuster(flagsValue, "legacy-escalation-ledger-pending", 7.5),
    ],
    [],
    3,
    45034.5,
  );
}
