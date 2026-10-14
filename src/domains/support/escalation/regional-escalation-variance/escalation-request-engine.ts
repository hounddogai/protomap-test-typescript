import * as numbers from "../../../../kit/numbers.js";
import { EscalationRequest } from "./escalation-request.js";

/** One step of the escalation request calculation. */
export interface EscalationRequestStep {
  describe(): string;
  adjust(item: EscalationRequest, value: number): number;
}

export class MinimumEscalationRequestAdjuster implements EscalationRequestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EscalationRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredEscalationRequestAdjuster implements EscalationRequestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EscalationRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class EscalationRequestEndsAtOffsetAdjuster implements EscalationRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: EscalationRequest, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class RoundingEscalationRequestAdjuster implements EscalationRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EscalationRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentEscalationRequestAdjuster implements EscalationRequestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EscalationRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the escalation request steps in order and keeps a trace of each. */
export class EscalationRequestEngine {
  steps: EscalationRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: EscalationRequest): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: EscalationRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultEscalationRequestEngine(): EscalationRequestEngine {
  return new EscalationRequestEngine(
    [
      new MinimumEscalationRequestAdjuster(3),
      new TieredEscalationRequestAdjuster([2547, 4987, 7433, 8509], [1.08, 1.14, 1.2, 1.14]),
      new EscalationRequestEndsAtOffsetAdjuster(1.92),
      new RoundingEscalationRequestAdjuster(0.5),
      new PercentEscalationRequestAdjuster(-3.8),
    ],
    [],
    3.4,
    76735,
  );
}
