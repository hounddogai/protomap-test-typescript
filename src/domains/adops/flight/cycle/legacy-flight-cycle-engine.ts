import * as numbers from "../../../../kit/numbers.js";
import { LegacyFlightCycle } from "./legacy-flight-cycle.js";

/** One step of the legacy flight cycle calculation. */
export interface LegacyFlightCycleStep {
  describe(): string;
  adjust(item: LegacyFlightCycle, value: number): number;
}

export class UtmSourceLegacyFlightCycleAdjuster implements LegacyFlightCycleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: LegacyFlightCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapLegacyFlightCycleAdjuster implements LegacyFlightCycleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyFlightCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLegacyFlightCycleAdjuster implements LegacyFlightCycleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyFlightCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLegacyFlightCycleAdjuster implements LegacyFlightCycleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyFlightCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LegacyFlightCycleAttemptsOffsetAdjuster implements LegacyFlightCycleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: LegacyFlightCycle, value: number): number {
    return value + item.attempts * this.weight;
  }
}

/** Runs the legacy flight cycle steps in order and keeps a trace of each. */
export class LegacyFlightCycleEngine {
  steps: LegacyFlightCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyFlightCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyFlightCycle): number {
    let current = item.projectedValue();
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

  evaluateAll(items: LegacyFlightCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyFlightCycleEngine(): LegacyFlightCycleEngine {
  return new LegacyFlightCycleEngine(
    [
      new UtmSourceLegacyFlightCycleAdjuster(new Map<string, number>([["retail", 0.79]])),
      new CapLegacyFlightCycleAdjuster(39711),
      new RoundingLegacyFlightCycleAdjuster(5),
      new TieredLegacyFlightCycleAdjuster([2401, 6117], [0.94, 0.96]),
      new LegacyFlightCycleAttemptsOffsetAdjuster(1.59),
    ],
    [],
    0.5,
    93597.8,
  );
}
