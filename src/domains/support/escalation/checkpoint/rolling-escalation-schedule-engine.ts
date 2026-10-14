import * as numbers from "../../../../kit/numbers.js";
import { RollingEscalationSchedule } from "./rolling-escalation-schedule.js";

/** One step of the rolling escalation schedule calculation. */
export interface RollingEscalationScheduleFactor {
  describe(): string;
  adjust(item: RollingEscalationSchedule, value: number): number;
}

export class MinimumRollingEscalationScheduleAdjuster implements RollingEscalationScheduleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingEscalationSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRollingEscalationScheduleAdjuster implements RollingEscalationScheduleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingEscalationSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RollingEscalationScheduleSequenceOffsetAdjuster implements RollingEscalationScheduleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: RollingEscalationSchedule, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class RoundingRollingEscalationScheduleAdjuster implements RollingEscalationScheduleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingEscalationSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelRollingEscalationScheduleAdjuster implements RollingEscalationScheduleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RollingEscalationSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling escalation schedule steps in order and keeps a trace of each. */
export class RollingEscalationScheduleEngine {
  steps: RollingEscalationScheduleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingEscalationScheduleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingEscalationSchedule): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: RollingEscalationSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingEscalationScheduleEngine(): RollingEscalationScheduleEngine {
  return new RollingEscalationScheduleEngine(
    [
      new MinimumRollingEscalationScheduleAdjuster(0.5),
      new TieredRollingEscalationScheduleAdjuster([4379, 5218, 9073], [1.02, 1.08, 0.93]),
      new RollingEscalationScheduleSequenceOffsetAdjuster(0.56),
      new RoundingRollingEscalationScheduleAdjuster(5),
      new LabelRollingEscalationScheduleAdjuster(new Map<string, number>([["east", 1.11], ["online", 1.1]])),
    ],
    [],
    1.6,
    33548.5,
  );
}
