import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MacroAgreement } from "./macro-agreement.js";

/** One step of the macro agreement calculation. */
export interface MacroAgreementStep {
  describe(): string;
  adjust(item: MacroAgreement, value: number): number;
}

export class FlaggedMacroAgreementAdjuster implements MacroAgreementStep {
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

  adjust(item: MacroAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumMacroAgreementAdjuster implements MacroAgreementStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MacroAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleMacroAgreementAdjuster implements MacroAgreementStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: MacroAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentMacroAgreementAdjuster implements MacroAgreementStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MacroAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapMacroAgreementAdjuster implements MacroAgreementStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MacroAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MacroAgreementLimitOffsetAdjuster implements MacroAgreementStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: MacroAgreement, value: number): number {
    return value + item.limit * this.weight;
  }
}

/** Runs the macro agreement steps in order and keeps a trace of each. */
export class MacroAgreementEngine {
  steps: MacroAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: MacroAgreement): number {
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

  evaluateAll(items: MacroAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultMacroAgreementEngine(flagsValue: flags.Registry): MacroAgreementEngine {
  return new MacroAgreementEngine(
    [
      new FlaggedMacroAgreementAdjuster(flagsValue, "macro-agreement-manual", -4.3),
      new MinimumMacroAgreementAdjuster(35.7),
      new LocaleMacroAgreementAdjuster(new Map<string, number>([["online", 1.11]])),
      new PercentMacroAgreementAdjuster(-6.8),
      new CapMacroAgreementAdjuster(41103),
      new MacroAgreementLimitOffsetAdjuster(1.51),
    ],
    [],
    3.5,
    60003,
  );
}
