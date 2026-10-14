import { RollingTicketViewRollup } from "./rolling-ticket-view-rollup.js";

/** One step of the rolling ticket view rollup calculation. */
export interface RollingTicketViewRollupFactor {
  describe(): string;
  adjust(item: RollingTicketViewRollup, value: number): number;
}

export class PercentRollingTicketViewRollupAdjuster implements RollingTicketViewRollupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingTicketViewRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameRollingTicketViewRollupAdjuster implements RollingTicketViewRollupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RollingTicketViewRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRollingTicketViewRollupAdjuster implements RollingTicketViewRollupFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingTicketViewRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling ticket view rollup steps in order and keeps a trace of each. */
export class RollingTicketViewRollupEngine {
  steps: RollingTicketViewRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingTicketViewRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingTicketViewRollup): number {
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

  evaluateAll(items: RollingTicketViewRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingTicketViewRollupEngine(): RollingTicketViewRollupEngine {
  return new RollingTicketViewRollupEngine(
    [
      new PercentRollingTicketViewRollupAdjuster(11.9),
      new NameRollingTicketViewRollupAdjuster(
        new Map<string, number>([["north", 1.09], ["west", 1.06], ["east", 0.98]]),
      ),
      new TieredRollingTicketViewRollupAdjuster([2432, 4959], [1.02, 0.8]),
    ],
    [],
    3.5,
    77292.8,
  );
}
