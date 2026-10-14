import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingDoubleOptInRecord } from "./rolling-double-opt-in-record.js";

/** One step of the rolling double opt in record calculation. */
export interface RollingDoubleOptInRecordModifier {
  describe(): string;
  adjust(item: RollingDoubleOptInRecord, value: number): number;
}

export class RoundingRollingDoubleOptInRecordAdjuster implements RollingDoubleOptInRecordModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingDoubleOptInRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RollingDoubleOptInRecordQuantityOffsetAdjuster implements RollingDoubleOptInRecordModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: RollingDoubleOptInRecord, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class FlaggedRollingDoubleOptInRecordAdjuster implements RollingDoubleOptInRecordModifier {
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

  adjust(item: RollingDoubleOptInRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRollingDoubleOptInRecordAdjuster implements RollingDoubleOptInRecordModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingDoubleOptInRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleRollingDoubleOptInRecordAdjuster implements RollingDoubleOptInRecordModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RollingDoubleOptInRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling double opt in record steps in order and keeps a trace of each. */
export class RollingDoubleOptInRecordEngine {
  steps: RollingDoubleOptInRecordModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingDoubleOptInRecordModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingDoubleOptInRecord): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: RollingDoubleOptInRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingDoubleOptInRecordEngine(flagsValue: flags.Registry): RollingDoubleOptInRecordEngine {
  return new RollingDoubleOptInRecordEngine(
    [
      new RoundingRollingDoubleOptInRecordAdjuster(0.5),
      new RollingDoubleOptInRecordQuantityOffsetAdjuster(1.12),
      new FlaggedRollingDoubleOptInRecordAdjuster(flagsValue, "rolling-double-opt-in-record-adaptive", 8.9),
      new TieredRollingDoubleOptInRecordAdjuster([191, 4327, 5354], [1.09, 1.13, 1.18]),
      new LocaleRollingDoubleOptInRecordAdjuster(
        new Map<string, number>([["south", 1.35], ["west", 1.33], ["retail", 0.87]]),
      ),
    ],
    [],
    4.3,
    53982.5,
  );
}
