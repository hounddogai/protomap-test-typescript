import * as numbers from "../../../../kit/numbers.js";
import { FunnelSchedule } from "./funnel-schedule.js";

/** One step of the funnel schedule calculation. */
export interface FunnelScheduleModifier {
  describe(): string;
  adjust(item: FunnelSchedule, value: number): number;
}

export class TieredFunnelScheduleAdjuster implements FunnelScheduleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FunnelSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumFunnelScheduleAdjuster implements FunnelScheduleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FunnelScheduleFloorValueOffsetAdjuster implements FunnelScheduleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: FunnelSchedule, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

/** Runs the funnel schedule steps in order and keeps a trace of each. */
export class FunnelScheduleEngine {
  steps: FunnelScheduleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelScheduleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FunnelSchedule): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: FunnelSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFunnelScheduleEngine(): FunnelScheduleEngine {
  return new FunnelScheduleEngine(
    [
      new TieredFunnelScheduleAdjuster([501, 4176, 5836], [0.86, 1.06, 0.83]),
      new MinimumFunnelScheduleAdjuster(35.2),
      new FunnelScheduleFloorValueOffsetAdjuster(0.68),
    ],
    [],
    1.1,
    5720.9,
  );
}
