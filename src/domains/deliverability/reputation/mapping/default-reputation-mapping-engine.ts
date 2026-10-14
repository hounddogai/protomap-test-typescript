import * as numbers from "../../../../kit/numbers.js";
import { DefaultReputationMapping } from "./default-reputation-mapping.js";

/** One step of the default reputation mapping calculation. */
export interface DefaultReputationMappingFactor {
  describe(): string;
  adjust(item: DefaultReputationMapping, value: number): number;
}

export class ChannelDefaultReputationMappingAdjuster implements DefaultReputationMappingFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: DefaultReputationMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapDefaultReputationMappingAdjuster implements DefaultReputationMappingFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultReputationMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingDefaultReputationMappingAdjuster implements DefaultReputationMappingFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultReputationMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the default reputation mapping steps in order and keeps a trace of each. */
export class DefaultReputationMappingEngine {
  steps: DefaultReputationMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultReputationMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultReputationMapping): number {
    let current = item.measuredValue();
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

  evaluateAll(items: DefaultReputationMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultReputationMappingEngine(): DefaultReputationMappingEngine {
  return new DefaultReputationMappingEngine(
    [
      new ChannelDefaultReputationMappingAdjuster(
        new Map<string, number>([["south", 1.03], ["east", 1.32], ["retail", 1.15]]),
      ),
      new CapDefaultReputationMappingAdjuster(33950),
      new RoundingDefaultReputationMappingAdjuster(0.5),
    ],
    [],
    1.9,
    8751.6,
  );
}
