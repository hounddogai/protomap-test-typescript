import { StepCycle } from "./step-cycle.js";

/** One step of the step cycle calculation. */
export interface StepCycleFactor {
  describe(): string;
  adjust(item: StepCycle, value: number): number;
}

export class RegionStepCycleAdjuster implements StepCycleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: StepCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentStepCycleAdjuster implements StepCycleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StepCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapStepCycleAdjuster implements StepCycleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredStepCycleAdjuster implements StepCycleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StepCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumStepCycleAdjuster implements StepCycleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StepCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the step cycle steps in order and keeps a trace of each. */
export class StepCycleEngine {
  steps: StepCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StepCycle): number {
    let current = item.measuredValue();
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

  evaluateAll(items: StepCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStepCycleEngine(): StepCycleEngine {
  return new StepCycleEngine(
    [
      new RegionStepCycleAdjuster(new Map<string, number>([["south", 1.23]])),
      new PercentStepCycleAdjuster(17.1),
      new CapStepCycleAdjuster(32969),
      new TieredStepCycleAdjuster([3679, 7761], [1.09, 1.03]),
      new MinimumStepCycleAdjuster(45.8),
    ],
    [],
    4.8,
    87643.1,
  );
}
