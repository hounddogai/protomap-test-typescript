import { DomainRollup } from "./domain-rollup.js";

/** One step of the domain rollup calculation. */
export interface DomainRollupFactor {
  describe(): string;
  adjust(item: DomainRollup, value: number): number;
}

export class DomainRollupFrequencyCapOffsetAdjuster implements DomainRollupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: DomainRollup, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class ChannelDomainRollupAdjuster implements DomainRollupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: DomainRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapDomainRollupAdjuster implements DomainRollupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DomainRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the domain rollup steps in order and keeps a trace of each. */
export class DomainRollupEngine {
  steps: DomainRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DomainRollup): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: DomainRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDomainRollupEngine(): DomainRollupEngine {
  return new DomainRollupEngine(
    [
      new DomainRollupFrequencyCapOffsetAdjuster(1.33),
      new ChannelDomainRollupAdjuster(new Map<string, number>([["south", 0.92], ["central", 1.24]])),
      new CapDomainRollupAdjuster(18207),
    ],
    [],
    2.9,
    62332.6,
  );
}
