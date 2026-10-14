import { TouchpointReservation } from "./touchpoint-reservation.js";

/** One step of the touchpoint reservation calculation. */
export interface TouchpointReservationStep {
  describe(): string;
  adjust(item: TouchpointReservation, value: number): number;
}

export class NameTouchpointReservationAdjuster implements TouchpointReservationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: TouchpointReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumTouchpointReservationAdjuster implements TouchpointReservationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TouchpointReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TouchpointReservationImpressionsOffsetAdjuster implements TouchpointReservationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: TouchpointReservation, value: number): number {
    return value + item.impressions * this.weight;
  }
}

/** Runs the touchpoint reservation steps in order and keeps a trace of each. */
export class TouchpointReservationEngine {
  steps: TouchpointReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TouchpointReservation): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: TouchpointReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTouchpointReservationEngine(): TouchpointReservationEngine {
  return new TouchpointReservationEngine(
    [
      new NameTouchpointReservationAdjuster(new Map<string, number>([["south", 0.9], ["central", 1]])),
      new MinimumTouchpointReservationAdjuster(23.2),
      new TouchpointReservationImpressionsOffsetAdjuster(1.62),
    ],
    [],
    4.9,
    73834.8,
  );
}
