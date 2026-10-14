import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreativeScore } from "./creative-score.js";

/** One step of the creative score calculation. */
export interface CreativeScoreModifier {
  describe(): string;
  adjust(item: CreativeScore, value: number): number;
}

export class TieredCreativeScoreAdjuster implements CreativeScoreModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingCreativeScoreAdjuster implements CreativeScoreModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RegionCreativeScoreAdjuster implements CreativeScoreModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: CreativeScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CreativeScoreRevisionOffsetAdjuster implements CreativeScoreModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: CreativeScore, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class FlaggedCreativeScoreAdjuster implements CreativeScoreModifier {
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

  adjust(item: CreativeScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the creative score steps in order and keeps a trace of each. */
export class CreativeScoreEngine {
  steps: CreativeScoreModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeScoreModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CreativeScore): number {
    let current = item.projectedValue();
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

  evaluateAll(items: CreativeScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCreativeScoreEngine(flagsValue: flags.Registry): CreativeScoreEngine {
  return new CreativeScoreEngine(
    [
      new TieredCreativeScoreAdjuster([996, 3155, 3478, 4807], [1.08, 0.92, 0.98, 1.02]),
      new RoundingCreativeScoreAdjuster(0.1),
      new RegionCreativeScoreAdjuster(new Map<string, number>([["central", 0.82], ["east", 0.86]])),
      new CreativeScoreRevisionOffsetAdjuster(1.86),
      new FlaggedCreativeScoreAdjuster(flagsValue, "creative-score-pending", 6.7),
    ],
    [],
    2,
    30869.2,
  );
}
