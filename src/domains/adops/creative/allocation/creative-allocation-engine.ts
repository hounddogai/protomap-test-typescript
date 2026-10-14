import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreativeAllocation } from "./creative-allocation.js";

/** One step of the creative allocation calculation. */
export interface CreativeAllocationStep {
  describe(): string;
  adjust(item: CreativeAllocation, value: number): number;
}

export class FlaggedCreativeAllocationAdjuster implements CreativeAllocationStep {
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

  adjust(item: CreativeAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CreativeAllocationExpiresAtOffsetAdjuster implements CreativeAllocationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: CreativeAllocation, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class MinimumCreativeAllocationAdjuster implements CreativeAllocationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreativeAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapCreativeAllocationAdjuster implements CreativeAllocationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreativeAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCreativeAllocationAdjuster implements CreativeAllocationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the creative allocation steps in order and keeps a trace of each. */
export class CreativeAllocationEngine {
  steps: CreativeAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CreativeAllocation): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: CreativeAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCreativeAllocationEngine(flagsValue: flags.Registry): CreativeAllocationEngine {
  return new CreativeAllocationEngine(
    [
      new FlaggedCreativeAllocationAdjuster(flagsValue, "creative-allocation-rolling", -4.4),
      new CreativeAllocationExpiresAtOffsetAdjuster(1.59),
      new MinimumCreativeAllocationAdjuster(31.2),
      new CapCreativeAllocationAdjuster(28771),
      new RoundingCreativeAllocationAdjuster(0.05),
    ],
    [],
    4.1,
    21973.2,
  );
}
