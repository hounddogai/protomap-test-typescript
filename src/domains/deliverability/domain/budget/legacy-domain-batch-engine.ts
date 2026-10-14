import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyDomainBatch } from "./legacy-domain-batch.js";

/** One step of the legacy domain batch calculation. */
export interface LegacyDomainBatchAdjuster {
  describe(): string;
  adjust(item: LegacyDomainBatch, value: number): number;
}

export class CapLegacyDomainBatchAdjuster implements LegacyDomainBatchAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyDomainBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLegacyDomainBatchAdjuster implements LegacyDomainBatchAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyDomainBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLegacyDomainBatchAdjuster implements LegacyDomainBatchAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyDomainBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLegacyDomainBatchAdjuster implements LegacyDomainBatchAdjuster {
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

  adjust(item: LegacyDomainBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LegacyDomainBatchLimitOffsetAdjuster implements LegacyDomainBatchAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: LegacyDomainBatch, value: number): number {
    return value + item.limit * this.weight;
  }
}

/** Runs the legacy domain batch steps in order and keeps a trace of each. */
export class LegacyDomainBatchEngine {
  steps: LegacyDomainBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyDomainBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyDomainBatch): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: LegacyDomainBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyDomainBatchEngine(flagsValue: flags.Registry): LegacyDomainBatchEngine {
  return new LegacyDomainBatchEngine(
    [
      new CapLegacyDomainBatchAdjuster(48096),
      new RoundingLegacyDomainBatchAdjuster(0.05),
      new MinimumLegacyDomainBatchAdjuster(17.5),
      new FlaggedLegacyDomainBatchAdjuster(flagsValue, "legacy-domain-batch-strict", -4.3),
      new LegacyDomainBatchLimitOffsetAdjuster(1.19),
    ],
    [],
    1.9,
    67602.7,
  );
}
