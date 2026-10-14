import { RollingFlightBudget } from "./rolling-flight-budget.js";

/** One step of the rolling flight budget calculation. */
export interface RollingFlightBudgetFactor {
  describe(): string;
  adjust(item: RollingFlightBudget, value: number): number;
}

export class ChannelRollingFlightBudgetAdjuster implements RollingFlightBudgetFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RollingFlightBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRollingFlightBudgetAdjuster implements RollingFlightBudgetFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingFlightBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRollingFlightBudgetAdjuster implements RollingFlightBudgetFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingFlightBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling flight budget steps in order and keeps a trace of each. */
export class RollingFlightBudgetEngine {
  steps: RollingFlightBudgetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingFlightBudgetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingFlightBudget): number {
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

  evaluateAll(items: RollingFlightBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingFlightBudgetEngine(): RollingFlightBudgetEngine {
  return new RollingFlightBudgetEngine(
    [
      new ChannelRollingFlightBudgetAdjuster(new Map<string, number>([["south", 0.97]])),
      new TieredRollingFlightBudgetAdjuster([4504, 5553], [0.88, 0.85]),
      new PercentRollingFlightBudgetAdjuster(-5.5),
    ],
    [],
    1.6,
    24284.1,
  );
}
