import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SenderScore } from "./sender-score.js";

/** One step of the sender score calculation. */
export interface SenderScoreModifier {
  describe(): string;
  adjust(item: SenderScore, value: number): number;
}

export class FlaggedSenderScoreAdjuster implements SenderScoreModifier {
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

  adjust(item: SenderScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredSenderScoreAdjuster implements SenderScoreModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SenderScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentSenderScoreAdjuster implements SenderScoreModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SenderScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSenderScoreAdjuster implements SenderScoreModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SenderScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the sender score steps in order and keeps a trace of each. */
export class SenderScoreEngine {
  steps: SenderScoreModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderScoreModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SenderScore): number {
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

  evaluateAll(items: SenderScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSenderScoreEngine(flagsValue: flags.Registry): SenderScoreEngine {
  return new SenderScoreEngine(
    [
      new FlaggedSenderScoreAdjuster(flagsValue, "sender-score-primary", 1.9),
      new TieredSenderScoreAdjuster([907, 8767], [0.98, 0.92]),
      new PercentSenderScoreAdjuster(14),
      new RoundingSenderScoreAdjuster(5),
    ],
    [],
    1.5,
    98098.2,
  );
}
