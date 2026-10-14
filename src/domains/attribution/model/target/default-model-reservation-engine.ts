import { DefaultModelReservation } from "./default-model-reservation.js";

/** One step of the default model reservation calculation. */
export interface DefaultModelReservationStep {
  describe(): string;
  adjust(item: DefaultModelReservation, value: number): number;
}

export class TieredDefaultModelReservationAdjuster implements DefaultModelReservationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultModelReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumDefaultModelReservationAdjuster implements DefaultModelReservationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultModelReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class DefaultModelReservationEndsAtOffsetAdjuster implements DefaultModelReservationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: DefaultModelReservation, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class PercentDefaultModelReservationAdjuster implements DefaultModelReservationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultModelReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default model reservation steps in order and keeps a trace of each. */
export class DefaultModelReservationEngine {
  steps: DefaultModelReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultModelReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultModelReservation): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: DefaultModelReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultModelReservationEngine(): DefaultModelReservationEngine {
  return new DefaultModelReservationEngine(
    [
      new TieredDefaultModelReservationAdjuster([3990, 6058, 8735], [0.93, 0.83, 0.9]),
      new MinimumDefaultModelReservationAdjuster(11.4),
      new DefaultModelReservationEndsAtOffsetAdjuster(0.3),
      new PercentDefaultModelReservationAdjuster(22.3),
    ],
    [],
    3.9,
    26151.8,
  );
}
