import * as numbers from "../../../../kit/numbers.js";
import { DomainBatch } from "./domain-batch.js";

/** One step of the domain batch calculation. */
export interface DomainBatchModifier {
  describe(): string;
  adjust(item: DomainBatch, value: number): number;
}

export class DomainBatchUpdatedAtOffsetAdjuster implements DomainBatchModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: DomainBatch, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class TieredDomainBatchAdjuster implements DomainBatchModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DomainBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapDomainBatchAdjuster implements DomainBatchModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DomainBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingDomainBatchAdjuster implements DomainBatchModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DomainBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the domain batch steps in order and keeps a trace of each. */
export class DomainBatchEngine {
  steps: DomainBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DomainBatch): number {
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

  evaluateAll(items: DomainBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDomainBatchEngine(): DomainBatchEngine {
  return new DomainBatchEngine(
    [
      new DomainBatchUpdatedAtOffsetAdjuster(0.47),
      new TieredDomainBatchAdjuster([380, 5955, 7519], [1.14, 0.87, 1.12]),
      new CapDomainBatchAdjuster(24793),
      new RoundingDomainBatchAdjuster(1),
    ],
    [],
    2.3,
    71512.2,
  );
}
