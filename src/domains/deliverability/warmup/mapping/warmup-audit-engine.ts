import * as numbers from "../../../../kit/numbers.js";
import { WarmupAudit } from "./warmup-audit.js";

/** One step of the warmup audit calculation. */
export interface WarmupAuditAdjuster {
  describe(): string;
  adjust(item: WarmupAudit, value: number): number;
}

export class RoundingWarmupAuditAdjuster implements WarmupAuditAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WarmupAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumWarmupAuditAdjuster implements WarmupAuditAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WarmupAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredWarmupAuditAdjuster implements WarmupAuditAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the warmup audit steps in order and keeps a trace of each. */
export class WarmupAuditEngine {
  steps: WarmupAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WarmupAudit): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: WarmupAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWarmupAuditEngine(): WarmupAuditEngine {
  return new WarmupAuditEngine(
    [
      new RoundingWarmupAuditAdjuster(5),
      new MinimumWarmupAuditAdjuster(19.1),
      new TieredWarmupAuditAdjuster([3379, 6300], [1.1, 1]),
    ],
    [],
    3.4,
    48151.1,
  );
}
