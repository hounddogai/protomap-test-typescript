import * as numbers from "../../../../kit/numbers.js";
import { GlobalFlightSummary } from "./global-flight-summary.js";

/** One step of the global flight summary calculation. */
export interface GlobalFlightSummaryFactor {
  describe(): string;
  adjust(item: GlobalFlightSummary, value: number): number;
}

export class GlobalFlightSummaryUpdatedAtOffsetAdjuster implements GlobalFlightSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: GlobalFlightSummary, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class LabelGlobalFlightSummaryAdjuster implements GlobalFlightSummaryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: GlobalFlightSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredGlobalFlightSummaryAdjuster implements GlobalFlightSummaryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalFlightSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the global flight summary steps in order and keeps a trace of each. */
export class GlobalFlightSummaryEngine {
  steps: GlobalFlightSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalFlightSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalFlightSummary): number {
    let current = item.netValue();
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

  evaluateAll(items: GlobalFlightSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalFlightSummaryEngine(): GlobalFlightSummaryEngine {
  return new GlobalFlightSummaryEngine(
    [
      new GlobalFlightSummaryUpdatedAtOffsetAdjuster(1.17),
      new LabelGlobalFlightSummaryAdjuster(new Map<string, number>([["online", 1.12], ["north", 0.73]])),
      new TieredGlobalFlightSummaryAdjuster([911, 1324, 1659, 7619], [1.19, 1.15, 1.17, 1.16]),
    ],
    [],
    1.5,
    99600.6,
  );
}
