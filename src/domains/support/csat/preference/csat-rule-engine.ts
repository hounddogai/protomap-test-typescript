import { CsatRule } from "./csat-rule.js";

/** One step of the csat rule calculation. */
export interface CsatRuleModifier {
  describe(): string;
  adjust(item: CsatRule, value: number): number;
}

export class TieredCsatRuleAdjuster implements CsatRuleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CsatRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CsatRuleRevisionOffsetAdjuster implements CsatRuleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: CsatRule, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class PercentCsatRuleAdjuster implements CsatRuleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CsatRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapCsatRuleAdjuster implements CsatRuleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CsatRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the csat rule steps in order and keeps a trace of each. */
export class CsatRuleEngine {
  steps: CsatRuleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatRuleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CsatRule): number {
    let current = item.netExposure();
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

  evaluateAll(items: CsatRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCsatRuleEngine(): CsatRuleEngine {
  return new CsatRuleEngine(
    [
      new TieredCsatRuleAdjuster([1538, 6160, 9504], [0.97, 0.99, 1.01]),
      new CsatRuleRevisionOffsetAdjuster(1.23),
      new PercentCsatRuleAdjuster(13.3),
      new CapCsatRuleAdjuster(17221),
    ],
    [],
    2,
    26250,
  );
}
