import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingPlacementLedger } from "./rolling-placement-ledger.js";

/** One step of the rolling placement ledger calculation. */
export interface RollingPlacementLedgerAdjuster {
  describe(): string;
  adjust(item: RollingPlacementLedger, value: number): number;
}

export class RoundingRollingPlacementLedgerAdjuster implements RollingPlacementLedgerAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingPlacementLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRollingPlacementLedgerAdjuster implements RollingPlacementLedgerAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingPlacementLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RollingPlacementLedgerDiscountOffsetAdjuster implements RollingPlacementLedgerAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: RollingPlacementLedger, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class PercentRollingPlacementLedgerAdjuster implements RollingPlacementLedgerAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingPlacementLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRollingPlacementLedgerAdjuster implements RollingPlacementLedgerAdjuster {
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

  adjust(item: RollingPlacementLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling placement ledger steps in order and keeps a trace of each. */
export class RollingPlacementLedgerEngine {
  steps: RollingPlacementLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingPlacementLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingPlacementLedger): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: RollingPlacementLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingPlacementLedgerEngine(flagsValue: flags.Registry): RollingPlacementLedgerEngine {
  return new RollingPlacementLedgerEngine(
    [
      new RoundingRollingPlacementLedgerAdjuster(1),
      new MinimumRollingPlacementLedgerAdjuster(29.2),
      new RollingPlacementLedgerDiscountOffsetAdjuster(0.29),
      new PercentRollingPlacementLedgerAdjuster(21.1),
      new FlaggedRollingPlacementLedgerAdjuster(flagsValue, "rolling-placement-ledger-regional", -5.8),
    ],
    [],
    1.8,
    52494.4,
  );
}
