import { RollingFunnelThreshold } from "./rolling-funnel-threshold.js";

/** One step of the rolling funnel threshold calculation. */
export interface RollingFunnelThresholdFactor {
  describe(): string;
  adjust(item: RollingFunnelThreshold, value: number): number;
}

export class PercentRollingFunnelThresholdAdjuster implements RollingFunnelThresholdFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingFunnelThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRollingFunnelThresholdAdjuster implements RollingFunnelThresholdFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingFunnelThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UnitRollingFunnelThresholdAdjuster implements RollingFunnelThresholdFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: RollingFunnelThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RollingFunnelThresholdScoreOffsetAdjuster implements RollingFunnelThresholdFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: RollingFunnelThreshold, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the rolling funnel threshold steps in order and keeps a trace of each. */
export class RollingFunnelThresholdEngine {
  steps: RollingFunnelThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingFunnelThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingFunnelThreshold): number {
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

  evaluateAll(items: RollingFunnelThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingFunnelThresholdEngine(): RollingFunnelThresholdEngine {
  return new RollingFunnelThresholdEngine(
    [
      new PercentRollingFunnelThresholdAdjuster(-14.7),
      new CapRollingFunnelThresholdAdjuster(11632),
      new UnitRollingFunnelThresholdAdjuster(new Map<string, number>([["retail", 1.05], ["online", 1.01]])),
      new RollingFunnelThresholdScoreOffsetAdjuster(1.48),
    ],
    [],
    1.9,
    22189.7,
  );
}
