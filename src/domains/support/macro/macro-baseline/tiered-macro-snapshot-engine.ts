import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredMacroSnapshot } from "./tiered-macro-snapshot.js";

/** One step of the tiered macro snapshot calculation. */
export interface TieredMacroSnapshotModifier {
  describe(): string;
  adjust(item: TieredMacroSnapshot, value: number): number;
}

export class CapTieredMacroSnapshotAdjuster implements TieredMacroSnapshotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredMacroSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTieredMacroSnapshotAdjuster implements TieredMacroSnapshotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredMacroSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedTieredMacroSnapshotAdjuster implements TieredMacroSnapshotModifier {
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

  adjust(item: TieredMacroSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered macro snapshot steps in order and keeps a trace of each. */
export class TieredMacroSnapshotEngine {
  steps: TieredMacroSnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredMacroSnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredMacroSnapshot): number {
    let current = item.netValue();
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

  evaluateAll(items: TieredMacroSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredMacroSnapshotEngine(flagsValue: flags.Registry): TieredMacroSnapshotEngine {
  return new TieredMacroSnapshotEngine(
    [
      new CapTieredMacroSnapshotAdjuster(25103),
      new RoundingTieredMacroSnapshotAdjuster(0.25),
      new FlaggedTieredMacroSnapshotAdjuster(flagsValue, "tiered-macro-snapshot-tiered", 0.1),
    ],
    [],
    2.6,
    67425.6,
  );
}
