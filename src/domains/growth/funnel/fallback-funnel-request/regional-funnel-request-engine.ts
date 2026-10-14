import * as numbers from "../../../../kit/numbers.js";
import { RegionalFunnelRequest } from "./regional-funnel-request.js";

/** One step of the regional funnel request calculation. */
export interface RegionalFunnelRequestFactor {
  describe(): string;
  adjust(item: RegionalFunnelRequest, value: number): number;
}

export class TieredRegionalFunnelRequestAdjuster implements RegionalFunnelRequestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalFunnelRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleRegionalFunnelRequestAdjuster implements RegionalFunnelRequestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RegionalFunnelRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingRegionalFunnelRequestAdjuster implements RegionalFunnelRequestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalFunnelRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRegionalFunnelRequestAdjuster implements RegionalFunnelRequestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalFunnelRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRegionalFunnelRequestAdjuster implements RegionalFunnelRequestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalFunnelRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the regional funnel request steps in order and keeps a trace of each. */
export class RegionalFunnelRequestEngine {
  steps: RegionalFunnelRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalFunnelRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalFunnelRequest): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: RegionalFunnelRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalFunnelRequestEngine(): RegionalFunnelRequestEngine {
  return new RegionalFunnelRequestEngine(
    [
      new TieredRegionalFunnelRequestAdjuster([69, 2983, 5546, 6418], [1.1, 0.8, 0.93, 1.07]),
      new TitleRegionalFunnelRequestAdjuster(new Map<string, number>([["east", 1.23]])),
      new RoundingRegionalFunnelRequestAdjuster(0.1),
      new PercentRegionalFunnelRequestAdjuster(23.1),
      new MinimumRegionalFunnelRequestAdjuster(49.5),
    ],
    [],
    3.4,
    68442.1,
  );
}
