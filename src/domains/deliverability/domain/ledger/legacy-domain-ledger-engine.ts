import * as numbers from "../../../../kit/numbers.js";
import { LegacyDomainLedger } from "./legacy-domain-ledger.js";

/** One step of the legacy domain ledger calculation. */
export interface LegacyDomainLedgerStep {
  describe(): string;
  adjust(item: LegacyDomainLedger, value: number): number;
}

export class LegacyDomainLedgerCreatedAtOffsetAdjuster implements LegacyDomainLedgerStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: LegacyDomainLedger, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class PercentLegacyDomainLedgerAdjuster implements LegacyDomainLedgerStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyDomainLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLegacyDomainLedgerAdjuster implements LegacyDomainLedgerStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyDomainLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapLegacyDomainLedgerAdjuster implements LegacyDomainLedgerStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyDomainLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the legacy domain ledger steps in order and keeps a trace of each. */
export class LegacyDomainLedgerEngine {
  steps: LegacyDomainLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyDomainLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyDomainLedger): number {
    let current = item.netVolume();
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

  evaluateAll(items: LegacyDomainLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyDomainLedgerEngine(): LegacyDomainLedgerEngine {
  return new LegacyDomainLedgerEngine(
    [
      new LegacyDomainLedgerCreatedAtOffsetAdjuster(1.62),
      new PercentLegacyDomainLedgerAdjuster(20.6),
      new RoundingLegacyDomainLedgerAdjuster(5),
      new CapLegacyDomainLedgerAdjuster(31900),
    ],
    [],
    0.1,
    82210,
  );
}
