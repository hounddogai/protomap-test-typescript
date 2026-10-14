import { StrictModelOverride } from "./strict-model-override.js";

/** One step of the strict model override calculation. */
export interface StrictModelOverrideFactor {
  describe(): string;
  adjust(item: StrictModelOverride, value: number): number;
}

export class ChannelStrictModelOverrideAdjuster implements StrictModelOverrideFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: StrictModelOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredStrictModelOverrideAdjuster implements StrictModelOverrideFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictModelOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentStrictModelOverrideAdjuster implements StrictModelOverrideFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictModelOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class StrictModelOverrideGraceDaysOffsetAdjuster implements StrictModelOverrideFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: StrictModelOverride, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

/** Runs the strict model override steps in order and keeps a trace of each. */
export class StrictModelOverrideEngine {
  steps: StrictModelOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictModelOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictModelOverride): number {
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

  evaluateAll(items: StrictModelOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictModelOverrideEngine(): StrictModelOverrideEngine {
  return new StrictModelOverrideEngine(
    [
      new ChannelStrictModelOverrideAdjuster(
        new Map<string, number>([["retail", 0.9], ["online", 0.81], ["east", 1.33]]),
      ),
      new TieredStrictModelOverrideAdjuster([596, 2039, 5433, 5788], [0.96, 0.93, 0.96, 0.88]),
      new PercentStrictModelOverrideAdjuster(-3.6),
      new StrictModelOverrideGraceDaysOffsetAdjuster(1.75),
    ],
    [],
    4.9,
    75084.6,
  );
}
