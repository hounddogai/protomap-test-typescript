import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ProofRule } from "./proof-rule.js";

/** One step of the proof rule calculation. */
export interface ProofRuleModifier {
  describe(): string;
  adjust(item: ProofRule, value: number): number;
}

export class MinimumProofRuleAdjuster implements ProofRuleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingProofRuleAdjuster implements ProofRuleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameProofRuleAdjuster implements ProofRuleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ProofRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredProofRuleAdjuster implements ProofRuleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedProofRuleAdjuster implements ProofRuleModifier {
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

  adjust(item: ProofRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the proof rule steps in order and keeps a trace of each. */
export class ProofRuleEngine {
  steps: ProofRuleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofRuleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ProofRule): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: ProofRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultProofRuleEngine(flagsValue: flags.Registry): ProofRuleEngine {
  return new ProofRuleEngine(
    [
      new MinimumProofRuleAdjuster(42.3),
      new RoundingProofRuleAdjuster(0.05),
      new NameProofRuleAdjuster(new Map<string, number>([["south", 0.72], ["online", 1.22], ["west", 1.11]])),
      new TieredProofRuleAdjuster([587, 1269], [0.84, 1.02]),
      new FlaggedProofRuleAdjuster(flagsValue, "proof-rule-fallback", 4.6),
    ],
    [],
    2.3,
    2248.1,
  );
}
