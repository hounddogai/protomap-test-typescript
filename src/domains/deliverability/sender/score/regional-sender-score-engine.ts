import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalSenderScore } from "./regional-sender-score.js";

/** One step of the regional sender score calculation. */
export interface RegionalSenderScoreAdjuster {
  describe(): string;
  adjust(item: RegionalSenderScore, value: number): number;
}

export class FlaggedRegionalSenderScoreAdjuster implements RegionalSenderScoreAdjuster {
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

  adjust(item: RegionalSenderScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalSenderScoreAdjuster implements RegionalSenderScoreAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalSenderScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRegionalSenderScoreAdjuster implements RegionalSenderScoreAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalSenderScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional sender score steps in order and keeps a trace of each. */
export class RegionalSenderScoreEngine {
  steps: RegionalSenderScoreAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalSenderScoreAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalSenderScore): number {
    let current = item.weightedValue();
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

  evaluateAll(items: RegionalSenderScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalSenderScoreEngine(flagsValue: flags.Registry): RegionalSenderScoreEngine {
  return new RegionalSenderScoreEngine(
    [
      new FlaggedRegionalSenderScoreAdjuster(flagsValue, "regional-sender-score-seasonal", -1.5),
      new RoundingRegionalSenderScoreAdjuster(0.5),
      new TieredRegionalSenderScoreAdjuster([1582, 2526, 7987], [0.84, 1.19, 0.83]),
    ],
    [],
    1.8,
    39816.1,
  );
}
