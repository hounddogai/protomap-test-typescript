import * as flags from "../../../../kit/flags.js";
import { EscalationOverride } from "./escalation-override.js";

/** One step of the escalation override calculation. */
export interface EscalationOverrideFactor {
  describe(): string;
  adjust(item: EscalationOverride, value: number): number;
}

export class MinimumEscalationOverrideAdjuster implements EscalationOverrideFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EscalationOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedEscalationOverrideAdjuster implements EscalationOverrideFactor {
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

  adjust(item: EscalationOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameEscalationOverrideAdjuster implements EscalationOverrideFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: EscalationOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredEscalationOverrideAdjuster implements EscalationOverrideFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EscalationOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentEscalationOverrideAdjuster implements EscalationOverrideFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EscalationOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class EscalationOverrideMinimumOffsetAdjuster implements EscalationOverrideFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: EscalationOverride, value: number): number {
    return value + item.minimum * this.weight;
  }
}

/** Runs the escalation override steps in order and keeps a trace of each. */
export class EscalationOverrideEngine {
  steps: EscalationOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: EscalationOverride): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: EscalationOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultEscalationOverrideEngine(flagsValue: flags.Registry): EscalationOverrideEngine {
  return new EscalationOverrideEngine(
    [
      new MinimumEscalationOverrideAdjuster(40.1),
      new FlaggedEscalationOverrideAdjuster(flagsValue, "escalation-override-fallback", -6.9),
      new NameEscalationOverrideAdjuster(new Map<string, number>([["retail", 1.17], ["east", 0.91]])),
      new TieredEscalationOverrideAdjuster([14, 7057], [0.91, 1.02]),
      new PercentEscalationOverrideAdjuster(-0.3),
      new EscalationOverrideMinimumOffsetAdjuster(1.03),
    ],
    [],
    4.4,
    84313.3,
  );
}
