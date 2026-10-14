import * as numbers from "../../../../kit/numbers.js";
import { RegionalDeflectionRecord } from "./regional-deflection-record.js";

/** One step of the regional deflection record calculation. */
export interface RegionalDeflectionRecordModifier {
  describe(): string;
  adjust(item: RegionalDeflectionRecord, value: number): number;
}

export class LabelRegionalDeflectionRecordAdjuster implements RegionalDeflectionRecordModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RegionalDeflectionRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RegionalDeflectionRecordSendAtOffsetAdjuster implements RegionalDeflectionRecordModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: RegionalDeflectionRecord, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class CapRegionalDeflectionRecordAdjuster implements RegionalDeflectionRecordModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalDeflectionRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRegionalDeflectionRecordAdjuster implements RegionalDeflectionRecordModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalDeflectionRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional deflection record steps in order and keeps a trace of each. */
export class RegionalDeflectionRecordEngine {
  steps: RegionalDeflectionRecordModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalDeflectionRecordModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalDeflectionRecord): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: RegionalDeflectionRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalDeflectionRecordEngine(): RegionalDeflectionRecordEngine {
  return new RegionalDeflectionRecordEngine(
    [
      new LabelRegionalDeflectionRecordAdjuster(new Map<string, number>([["south", 1.23], ["online", 0.91]])),
      new RegionalDeflectionRecordSendAtOffsetAdjuster(1.04),
      new CapRegionalDeflectionRecordAdjuster(10126),
      new TieredRegionalDeflectionRecordAdjuster([3008, 6012], [1.11, 1.11]),
    ],
    [],
    1.7,
    87936.3,
  );
}
