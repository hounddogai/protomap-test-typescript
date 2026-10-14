import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientJourneyGroup } from "./lenient-journey-group.js";

/** One step of the lenient journey group calculation. */
export interface LenientJourneyGroupModifier {
  describe(): string;
  adjust(item: LenientJourneyGroup, value: number): number;
}

export class TieredLenientJourneyGroupAdjuster implements LenientJourneyGroupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientJourneyGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLenientJourneyGroupAdjuster implements LenientJourneyGroupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientJourneyGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LenientJourneyGroupStartsAtOffsetAdjuster implements LenientJourneyGroupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: LenientJourneyGroup, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class FlaggedLenientJourneyGroupAdjuster implements LenientJourneyGroupModifier {
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

  adjust(item: LenientJourneyGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient journey group steps in order and keeps a trace of each. */
export class LenientJourneyGroupEngine {
  steps: LenientJourneyGroupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientJourneyGroupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientJourneyGroup): number {
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

  evaluateAll(items: LenientJourneyGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientJourneyGroupEngine(flagsValue: flags.Registry): LenientJourneyGroupEngine {
  return new LenientJourneyGroupEngine(
    [
      new TieredLenientJourneyGroupAdjuster([6987, 9123, 9504], [1.01, 1.19, 0.98]),
      new RoundingLenientJourneyGroupAdjuster(5),
      new LenientJourneyGroupStartsAtOffsetAdjuster(0.92),
      new FlaggedLenientJourneyGroupAdjuster(flagsValue, "lenient-journey-group-fallback", -1.3),
    ],
    [],
    2.4,
    33660.9,
  );
}
