import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MacroLedger } from "./macro-ledger.js";

/** One step of the macro ledger calculation. */
export interface MacroLedgerAdjuster {
  describe(): string;
  adjust(item: MacroLedger, value: number): number;
}

export class PercentMacroLedgerAdjuster implements MacroLedgerAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MacroLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MacroLedgerPriorityOffsetAdjuster implements MacroLedgerAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: MacroLedger, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class FlaggedMacroLedgerAdjuster implements MacroLedgerAdjuster {
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

  adjust(item: MacroLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the macro ledger steps in order and keeps a trace of each. */
export class MacroLedgerEngine {
  steps: MacroLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: MacroLedger): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: MacroLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultMacroLedgerEngine(flagsValue: flags.Registry): MacroLedgerEngine {
  return new MacroLedgerEngine(
    [
      new PercentMacroLedgerAdjuster(12.5),
      new MacroLedgerPriorityOffsetAdjuster(0.72),
      new FlaggedMacroLedgerAdjuster(flagsValue, "macro-ledger-global", 6),
    ],
    [],
    2.1,
    11627.7,
  );
}
