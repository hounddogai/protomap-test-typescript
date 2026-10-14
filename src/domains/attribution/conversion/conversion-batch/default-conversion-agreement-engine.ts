import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultConversionAgreement } from "./default-conversion-agreement.js";

/** One step of the default conversion agreement calculation. */
export interface DefaultConversionAgreementStep {
  describe(): string;
  adjust(item: DefaultConversionAgreement, value: number): number;
}

export class CapDefaultConversionAgreementAdjuster implements DefaultConversionAgreementStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultConversionAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredDefaultConversionAgreementAdjuster implements DefaultConversionAgreementStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultConversionAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDefaultConversionAgreementAdjuster implements DefaultConversionAgreementStep {
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

  adjust(item: DefaultConversionAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelDefaultConversionAgreementAdjuster implements DefaultConversionAgreementStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: DefaultConversionAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the default conversion agreement steps in order and keeps a trace of each. */
export class DefaultConversionAgreementEngine {
  steps: DefaultConversionAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultConversionAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultConversionAgreement): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: DefaultConversionAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultConversionAgreementEngine(flagsValue: flags.Registry): DefaultConversionAgreementEngine {
  return new DefaultConversionAgreementEngine(
    [
      new CapDefaultConversionAgreementAdjuster(19711),
      new TieredDefaultConversionAgreementAdjuster([246, 9441], [0.86, 1.14]),
      new FlaggedDefaultConversionAgreementAdjuster(flagsValue, "default-conversion-agreement-global", 3.4),
      new ChannelDefaultConversionAgreementAdjuster(new Map<string, number>([["retail", 1.1], ["east", 0.73]])),
    ],
    [],
    0.5,
    20475.2,
  );
}
