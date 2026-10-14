import * as numbers from "../../../../kit/numbers.js";
import { WeightedTicketViewAgreement } from "./weighted-ticket-view-agreement.js";

/** One step of the weighted ticket view agreement calculation. */
export interface WeightedTicketViewAgreementStep {
  describe(): string;
  adjust(item: WeightedTicketViewAgreement, value: number): number;
}

export class PercentWeightedTicketViewAgreementAdjuster implements WeightedTicketViewAgreementStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedTicketViewAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredWeightedTicketViewAgreementAdjuster implements WeightedTicketViewAgreementStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedTicketViewAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelWeightedTicketViewAgreementAdjuster implements WeightedTicketViewAgreementStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: WeightedTicketViewAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWeightedTicketViewAgreementAdjuster implements WeightedTicketViewAgreementStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedTicketViewAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingWeightedTicketViewAgreementAdjuster implements WeightedTicketViewAgreementStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedTicketViewAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the weighted ticket view agreement steps in order and keeps a trace of each. */
export class WeightedTicketViewAgreementEngine {
  steps: WeightedTicketViewAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedTicketViewAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedTicketViewAgreement): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: WeightedTicketViewAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedTicketViewAgreementEngine(): WeightedTicketViewAgreementEngine {
  return new WeightedTicketViewAgreementEngine(
    [
      new PercentWeightedTicketViewAgreementAdjuster(-17),
      new TieredWeightedTicketViewAgreementAdjuster([2035, 8154], [0.92, 1.06]),
      new ChannelWeightedTicketViewAgreementAdjuster(new Map<string, number>([["west", 0.71]])),
      new MinimumWeightedTicketViewAgreementAdjuster(33.9),
      new RoundingWeightedTicketViewAgreementAdjuster(0.5),
    ],
    [],
    1.7,
    29790.1,
  );
}
