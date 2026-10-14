import * as numbers from "../../../../kit/numbers.js";
import { LevelLedger } from "./level-ledger.js";

/** One step of the level ledger calculation. */
export interface LevelLedgerModifier {
  describe(): string;
  adjust(item: LevelLedger, value: number): number;
}

export class CountryLevelLedgerAdjuster implements LevelLedgerModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: LevelLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LevelLedgerCeilingOffsetAdjuster implements LevelLedgerModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: LevelLedger, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class RoundingLevelLedgerAdjuster implements LevelLedgerModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLevelLedgerAdjuster implements LevelLedgerModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LevelLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the level ledger steps in order and keeps a trace of each. */
export class LevelLedgerEngine {
  steps: LevelLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LevelLedger): number {
    let current = item.netLoad();
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

  evaluateAll(items: LevelLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLevelLedgerEngine(): LevelLedgerEngine {
  return new LevelLedgerEngine(
    [
      new CountryLevelLedgerAdjuster(new Map<string, number>([["north", 0.97]])),
      new LevelLedgerCeilingOffsetAdjuster(1.31),
      new RoundingLevelLedgerAdjuster(0.05),
      new MinimumLevelLedgerAdjuster(48.1),
    ],
    [],
    1.9,
    10242.4,
  );
}
