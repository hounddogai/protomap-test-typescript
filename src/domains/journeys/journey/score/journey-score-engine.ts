import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { JourneyScore } from "./journey-score.js";

/** One step of the journey score calculation. */
export interface JourneyScoreAdjuster {
  describe(): string;
  adjust(item: JourneyScore, value: number): number;
}

export class TieredJourneyScoreAdjuster implements JourneyScoreAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: JourneyScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourceJourneyScoreAdjuster implements JourneyScoreAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: JourneyScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapJourneyScoreAdjuster implements JourneyScoreAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: JourneyScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class JourneyScoreScoreOffsetAdjuster implements JourneyScoreAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: JourneyScore, value: number): number {
    return value + item.score * this.weight;
  }
}

export class FlaggedJourneyScoreAdjuster implements JourneyScoreAdjuster {
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

  adjust(item: JourneyScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the journey score steps in order and keeps a trace of each. */
export class JourneyScoreEngine {
  steps: JourneyScoreAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyScoreAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: JourneyScore): number {
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

  evaluateAll(items: JourneyScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultJourneyScoreEngine(flagsValue: flags.Registry): JourneyScoreEngine {
  return new JourneyScoreEngine(
    [
      new TieredJourneyScoreAdjuster([4551, 7772], [1.09, 1.19]),
      new SourceJourneyScoreAdjuster(new Map<string, number>([["west", 1.19]])),
      new CapJourneyScoreAdjuster(26355),
      new JourneyScoreScoreOffsetAdjuster(1.37),
      new FlaggedJourneyScoreAdjuster(flagsValue, "journey-score-regional", 4.5),
    ],
    [],
    2.3,
    8268.7,
  );
}
