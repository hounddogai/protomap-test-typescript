import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictNudgeMapping } from "./strict-nudge-mapping.js";

/** One step of the strict nudge mapping calculation. */
export interface StrictNudgeMappingModifier {
  describe(): string;
  adjust(item: StrictNudgeMapping, value: number): number;
}

export class LocaleStrictNudgeMappingAdjuster implements StrictNudgeMappingModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: StrictNudgeMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumStrictNudgeMappingAdjuster implements StrictNudgeMappingModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictNudgeMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingStrictNudgeMappingAdjuster implements StrictNudgeMappingModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictNudgeMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StrictNudgeMappingBidOffsetAdjuster implements StrictNudgeMappingModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: StrictNudgeMapping, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class FlaggedStrictNudgeMappingAdjuster implements StrictNudgeMappingModifier {
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

  adjust(item: StrictNudgeMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict nudge mapping steps in order and keeps a trace of each. */
export class StrictNudgeMappingEngine {
  steps: StrictNudgeMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictNudgeMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictNudgeMapping): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: StrictNudgeMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictNudgeMappingEngine(flagsValue: flags.Registry): StrictNudgeMappingEngine {
  return new StrictNudgeMappingEngine(
    [
      new LocaleStrictNudgeMappingAdjuster(new Map<string, number>([["south", 0.8]])),
      new MinimumStrictNudgeMappingAdjuster(1.5),
      new RoundingStrictNudgeMappingAdjuster(0.1),
      new StrictNudgeMappingBidOffsetAdjuster(0.69),
      new FlaggedStrictNudgeMappingAdjuster(flagsValue, "strict-nudge-mapping-fallback", 9.5),
    ],
    [],
    1.6,
    46559.3,
  );
}
