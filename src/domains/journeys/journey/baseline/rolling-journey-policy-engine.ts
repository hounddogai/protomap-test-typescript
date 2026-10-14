import * as numbers from "../../../../kit/numbers.js";
import { RollingJourneyPolicy } from "./rolling-journey-policy.js";

/** One step of the rolling journey policy calculation. */
export interface RollingJourneyPolicyFactor {
  describe(): string;
  adjust(item: RollingJourneyPolicy, value: number): number;
}

export class RoundingRollingJourneyPolicyAdjuster implements RollingJourneyPolicyFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingJourneyPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRollingJourneyPolicyAdjuster implements RollingJourneyPolicyFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingJourneyPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRollingJourneyPolicyAdjuster implements RollingJourneyPolicyFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingJourneyPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the rolling journey policy steps in order and keeps a trace of each. */
export class RollingJourneyPolicyEngine {
  steps: RollingJourneyPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingJourneyPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingJourneyPolicy): number {
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

  evaluateAll(items: RollingJourneyPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingJourneyPolicyEngine(): RollingJourneyPolicyEngine {
  return new RollingJourneyPolicyEngine(
    [
      new RoundingRollingJourneyPolicyAdjuster(0.5),
      new TieredRollingJourneyPolicyAdjuster([320, 3611, 4125, 8484], [0.97, 1.09, 0.83, 1.12]),
      new CapRollingJourneyPolicyAdjuster(40898),
    ],
    [],
    0.3,
    4468.6,
  );
}
