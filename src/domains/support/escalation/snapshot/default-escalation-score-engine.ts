import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultEscalationScore } from "./default-escalation-score.js";

/** One step of the default escalation score calculation. */
export interface DefaultEscalationScoreStep {
  describe(): string;
  adjust(item: DefaultEscalationScore, value: number): number;
}

export class RoundingDefaultEscalationScoreAdjuster implements DefaultEscalationScoreStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultEscalationScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumDefaultEscalationScoreAdjuster implements DefaultEscalationScoreStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultEscalationScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedDefaultEscalationScoreAdjuster implements DefaultEscalationScoreStep {
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

  adjust(item: DefaultEscalationScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameDefaultEscalationScoreAdjuster implements DefaultEscalationScoreStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: DefaultEscalationScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the default escalation score steps in order and keeps a trace of each. */
export class DefaultEscalationScoreEngine {
  steps: DefaultEscalationScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultEscalationScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultEscalationScore): number {
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

  evaluateAll(items: DefaultEscalationScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultEscalationScoreEngine(flagsValue: flags.Registry): DefaultEscalationScoreEngine {
  return new DefaultEscalationScoreEngine(
    [
      new RoundingDefaultEscalationScoreAdjuster(0.1),
      new MinimumDefaultEscalationScoreAdjuster(29),
      new FlaggedDefaultEscalationScoreAdjuster(flagsValue, "default-escalation-score-pending", 7.3),
      new NameDefaultEscalationScoreAdjuster(new Map<string, number>([["west", 1.2], ["retail", 0.93]])),
    ],
    [],
    3.4,
    63427.2,
  );
}
