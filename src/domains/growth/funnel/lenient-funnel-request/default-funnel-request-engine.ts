import { DefaultFunnelRequest } from "./default-funnel-request.js";

/** One step of the default funnel request calculation. */
export interface DefaultFunnelRequestStep {
  describe(): string;
  adjust(item: DefaultFunnelRequest, value: number): number;
}

export class TieredDefaultFunnelRequestAdjuster implements DefaultFunnelRequestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultFunnelRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class DefaultFunnelRequestStartsAtOffsetAdjuster implements DefaultFunnelRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: DefaultFunnelRequest, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class UtmSourceDefaultFunnelRequestAdjuster implements DefaultFunnelRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: DefaultFunnelRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the default funnel request steps in order and keeps a trace of each. */
export class DefaultFunnelRequestEngine {
  steps: DefaultFunnelRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultFunnelRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultFunnelRequest): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: DefaultFunnelRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultFunnelRequestEngine(): DefaultFunnelRequestEngine {
  return new DefaultFunnelRequestEngine(
    [
      new TieredDefaultFunnelRequestAdjuster([7690, 7945], [1.18, 0.83]),
      new DefaultFunnelRequestStartsAtOffsetAdjuster(0.96),
      new UtmSourceDefaultFunnelRequestAdjuster(
        new Map<string, number>([["east", 0.76], ["retail", 0.8], ["online", 0.84]]),
      ),
    ],
    [],
    4.8,
    12095.1,
  );
}
