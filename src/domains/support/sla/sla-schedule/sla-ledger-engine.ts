import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SlaLedger } from "./sla-ledger.js";

/** One step of the sla ledger calculation. */
export interface SlaLedgerModifier {
  describe(): string;
  adjust(item: SlaLedger, value: number): number;
}

export class TieredSlaLedgerAdjuster implements SlaLedgerModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SlaLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumSlaLedgerAdjuster implements SlaLedgerModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SlaLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SlaLedgerScoreOffsetAdjuster implements SlaLedgerModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: SlaLedger, value: number): number {
    return value + item.score * this.weight;
  }
}

export class FlaggedSlaLedgerAdjuster implements SlaLedgerModifier {
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

  adjust(item: SlaLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelSlaLedgerAdjuster implements SlaLedgerModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: SlaLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the sla ledger steps in order and keeps a trace of each. */
export class SlaLedgerEngine {
  steps: SlaLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SlaLedger): number {
    let current = item.weightedValue();
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

  evaluateAll(items: SlaLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSlaLedgerEngine(flagsValue: flags.Registry): SlaLedgerEngine {
  return new SlaLedgerEngine(
    [
      new TieredSlaLedgerAdjuster([275, 308], [0.89, 0.9]),
      new MinimumSlaLedgerAdjuster(42.5),
      new SlaLedgerScoreOffsetAdjuster(1.42),
      new FlaggedSlaLedgerAdjuster(flagsValue, "sla-ledger-fallback", 6.5),
      new ChannelSlaLedgerAdjuster(new Map<string, number>([["north", 1.13], ["east", 1.15]])),
    ],
    [],
    0.8,
    24900.8,
  );
}
