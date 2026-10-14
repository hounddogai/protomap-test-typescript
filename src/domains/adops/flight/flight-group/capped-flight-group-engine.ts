import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedFlightGroup } from "./capped-flight-group.js";

/** One step of the capped flight group calculation. */
export interface CappedFlightGroupAdjuster {
  describe(): string;
  adjust(item: CappedFlightGroup, value: number): number;
}

export class TitleCappedFlightGroupAdjuster implements CappedFlightGroupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: CappedFlightGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredCappedFlightGroupAdjuster implements CappedFlightGroupAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedFlightGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CappedFlightGroupCeilingOffsetAdjuster implements CappedFlightGroupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: CappedFlightGroup, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class FlaggedCappedFlightGroupAdjuster implements CappedFlightGroupAdjuster {
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

  adjust(item: CappedFlightGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCappedFlightGroupAdjuster implements CappedFlightGroupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedFlightGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the capped flight group steps in order and keeps a trace of each. */
export class CappedFlightGroupEngine {
  steps: CappedFlightGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedFlightGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedFlightGroup): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: CappedFlightGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedFlightGroupEngine(flagsValue: flags.Registry): CappedFlightGroupEngine {
  return new CappedFlightGroupEngine(
    [
      new TitleCappedFlightGroupAdjuster(new Map<string, number>([["online", 0.92]])),
      new TieredCappedFlightGroupAdjuster([759, 1149, 7295, 9923], [0.93, 1.06, 0.89, 1.04]),
      new CappedFlightGroupCeilingOffsetAdjuster(1.77),
      new FlaggedCappedFlightGroupAdjuster(flagsValue, "capped-flight-group-weighted", -9.6),
      new RoundingCappedFlightGroupAdjuster(0.5),
    ],
    [],
    4.3,
    5261.3,
  );
}
