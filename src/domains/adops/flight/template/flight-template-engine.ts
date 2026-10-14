import { FlightTemplate } from "./flight-template.js";

/** One step of the flight template calculation. */
export interface FlightTemplateFactor {
  describe(): string;
  adjust(item: FlightTemplate, value: number): number;
}

export class MinimumFlightTemplateAdjuster implements FlightTemplateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FlightTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlightTemplateFloorValueOffsetAdjuster implements FlightTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: FlightTemplate, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class CapFlightTemplateAdjuster implements FlightTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FlightTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredFlightTemplateAdjuster implements FlightTemplateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FlightTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the flight template steps in order and keeps a trace of each. */
export class FlightTemplateEngine {
  steps: FlightTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FlightTemplate): number {
    let current = item.projectedValue();
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

  evaluateAll(items: FlightTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFlightTemplateEngine(): FlightTemplateEngine {
  return new FlightTemplateEngine(
    [
      new MinimumFlightTemplateAdjuster(43.7),
      new FlightTemplateFloorValueOffsetAdjuster(0.24),
      new CapFlightTemplateAdjuster(21246),
      new TieredFlightTemplateAdjuster([1820, 3124, 5367], [1.18, 1.15, 1.05]),
    ],
    [],
    3.8,
    48285,
  );
}
