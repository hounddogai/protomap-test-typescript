import * as numbers from "../../../../kit/numbers.js";
import { PrimaryMacroSnapshot } from "./primary-macro-snapshot.js";

/** One step of the primary macro snapshot calculation. */
export interface PrimaryMacroSnapshotModifier {
  describe(): string;
  adjust(item: PrimaryMacroSnapshot, value: number): number;
}

export class PercentPrimaryMacroSnapshotAdjuster implements PrimaryMacroSnapshotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryMacroSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryMacroSnapshotAdjuster implements PrimaryMacroSnapshotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryMacroSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPrimaryMacroSnapshotAdjuster implements PrimaryMacroSnapshotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryMacroSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourcePrimaryMacroSnapshotAdjuster implements PrimaryMacroSnapshotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: PrimaryMacroSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the primary macro snapshot steps in order and keeps a trace of each. */
export class PrimaryMacroSnapshotEngine {
  steps: PrimaryMacroSnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryMacroSnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryMacroSnapshot): number {
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

  evaluateAll(items: PrimaryMacroSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryMacroSnapshotEngine(): PrimaryMacroSnapshotEngine {
  return new PrimaryMacroSnapshotEngine(
    [
      new PercentPrimaryMacroSnapshotAdjuster(2.4),
      new RoundingPrimaryMacroSnapshotAdjuster(0.05),
      new TieredPrimaryMacroSnapshotAdjuster([444, 6296], [1.17, 0.93]),
      new SourcePrimaryMacroSnapshotAdjuster(new Map<string, number>([["north", 1.31]])),
    ],
    [],
    2.4,
    68880.6,
  );
}
