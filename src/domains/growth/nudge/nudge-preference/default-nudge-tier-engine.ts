import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultNudgeTier } from "./default-nudge-tier.js";

/** One step of the default nudge tier calculation. */
export interface DefaultNudgeTierModifier {
  describe(): string;
  adjust(item: DefaultNudgeTier, value: number): number;
}

export class TieredDefaultNudgeTierAdjuster implements DefaultNudgeTierModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultNudgeTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingDefaultNudgeTierAdjuster implements DefaultNudgeTierModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultNudgeTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedDefaultNudgeTierAdjuster implements DefaultNudgeTierModifier {
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

  adjust(item: DefaultNudgeTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default nudge tier steps in order and keeps a trace of each. */
export class DefaultNudgeTierEngine {
  steps: DefaultNudgeTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultNudgeTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultNudgeTier): number {
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

  evaluateAll(items: DefaultNudgeTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultNudgeTierEngine(flagsValue: flags.Registry): DefaultNudgeTierEngine {
  return new DefaultNudgeTierEngine(
    [
      new TieredDefaultNudgeTierAdjuster([3104, 9853], [1.08, 1.14]),
      new RoundingDefaultNudgeTierAdjuster(0.25),
      new FlaggedDefaultNudgeTierAdjuster(flagsValue, "default-nudge-tier-lenient", -6.2),
    ],
    [],
    2.9,
    31897.4,
  );
}
