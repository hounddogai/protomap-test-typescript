import { DeflectionCycle } from "./deflection-cycle.js";

/** One step of the deflection cycle calculation. */
export interface DeflectionCycleFactor {
  describe(): string;
  adjust(item: DeflectionCycle, value: number): number;
}

export class TieredDeflectionCycleAdjuster implements DeflectionCycleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelDeflectionCycleAdjuster implements DeflectionCycleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: DeflectionCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class DeflectionCycleBatchSizeOffsetAdjuster implements DeflectionCycleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: DeflectionCycle, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

/** Runs the deflection cycle steps in order and keeps a trace of each. */
export class DeflectionCycleEngine {
  steps: DeflectionCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DeflectionCycle): number {
    let current = item.adjustedVolume();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: DeflectionCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDeflectionCycleEngine(): DeflectionCycleEngine {
  return new DeflectionCycleEngine(
    [
      new TieredDeflectionCycleAdjuster([707, 1236, 9794], [0.81, 1.14, 0.88]),
      new ChannelDeflectionCycleAdjuster(new Map<string, number>([["west", 1.28]])),
      new DeflectionCycleBatchSizeOffsetAdjuster(1.62),
    ],
    [],
    1.5,
    53962.7,
  );
}
