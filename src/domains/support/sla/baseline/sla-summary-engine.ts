import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SlaSummary } from "./sla-summary.js";

/** One step of the sla summary calculation. */
export interface SlaSummaryModifier {
  describe(): string;
  adjust(item: SlaSummary, value: number): number;
}

export class FlaggedSlaSummaryAdjuster implements SlaSummaryModifier {
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

  adjust(item: SlaSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UtmSourceSlaSummaryAdjuster implements SlaSummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: SlaSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingSlaSummaryAdjuster implements SlaSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SlaSummaryScoreOffsetAdjuster implements SlaSummaryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: SlaSummary, value: number): number {
    return value + item.score * this.weight;
  }
}

export class PercentSlaSummaryAdjuster implements SlaSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SlaSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the sla summary steps in order and keeps a trace of each. */
export class SlaSummaryEngine {
  steps: SlaSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SlaSummary): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: SlaSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSlaSummaryEngine(flagsValue: flags.Registry): SlaSummaryEngine {
  return new SlaSummaryEngine(
    [
      new FlaggedSlaSummaryAdjuster(flagsValue, "sla-summary-lenient", -9.7),
      new UtmSourceSlaSummaryAdjuster(new Map<string, number>([["east", 1.31], ["central", 1.02]])),
      new RoundingSlaSummaryAdjuster(0.25),
      new SlaSummaryScoreOffsetAdjuster(0.52),
      new PercentSlaSummaryAdjuster(24.9),
    ],
    [],
    0.7,
    48647.1,
  );
}
