import * as flags from "../../../../kit/flags.js";
import { DefaultMacroSnapshot } from "./default-macro-snapshot.js";

/** One step of the default macro snapshot calculation. */
export interface DefaultMacroSnapshotFactor {
  describe(): string;
  adjust(item: DefaultMacroSnapshot, value: number): number;
}

export class NameDefaultMacroSnapshotAdjuster implements DefaultMacroSnapshotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: DefaultMacroSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentDefaultMacroSnapshotAdjuster implements DefaultMacroSnapshotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultMacroSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedDefaultMacroSnapshotAdjuster implements DefaultMacroSnapshotFactor {
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

  adjust(item: DefaultMacroSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default macro snapshot steps in order and keeps a trace of each. */
export class DefaultMacroSnapshotEngine {
  steps: DefaultMacroSnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultMacroSnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultMacroSnapshot): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: DefaultMacroSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultMacroSnapshotEngine(flagsValue: flags.Registry): DefaultMacroSnapshotEngine {
  return new DefaultMacroSnapshotEngine(
    [
      new NameDefaultMacroSnapshotAdjuster(new Map<string, number>([["central", 0.8]])),
      new PercentDefaultMacroSnapshotAdjuster(7.6),
      new FlaggedDefaultMacroSnapshotAdjuster(flagsValue, "default-macro-snapshot-legacy", -7.6),
    ],
    [],
    1.9,
    58642.7,
  );
}
