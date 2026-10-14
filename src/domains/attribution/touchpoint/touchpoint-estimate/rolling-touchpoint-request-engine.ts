import * as numbers from "../../../../kit/numbers.js";
import { RollingTouchpointRequest } from "./rolling-touchpoint-request.js";

/** One step of the rolling touchpoint request calculation. */
export interface RollingTouchpointRequestModifier {
  describe(): string;
  adjust(item: RollingTouchpointRequest, value: number): number;
}

export class PercentRollingTouchpointRequestAdjuster implements RollingTouchpointRequestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingTouchpointRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingTouchpointRequestAdjuster implements RollingTouchpointRequestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingTouchpointRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RollingTouchpointRequestBudgetOffsetAdjuster implements RollingTouchpointRequestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: RollingTouchpointRequest, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class CapRollingTouchpointRequestAdjuster implements RollingTouchpointRequestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingTouchpointRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRollingTouchpointRequestAdjuster implements RollingTouchpointRequestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingTouchpointRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling touchpoint request steps in order and keeps a trace of each. */
export class RollingTouchpointRequestEngine {
  steps: RollingTouchpointRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingTouchpointRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingTouchpointRequest): number {
    let current = item.netLoad();
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

  evaluateAll(items: RollingTouchpointRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingTouchpointRequestEngine(): RollingTouchpointRequestEngine {
  return new RollingTouchpointRequestEngine(
    [
      new PercentRollingTouchpointRequestAdjuster(-5.3),
      new RoundingRollingTouchpointRequestAdjuster(5),
      new RollingTouchpointRequestBudgetOffsetAdjuster(1.47),
      new CapRollingTouchpointRequestAdjuster(12671),
      new TieredRollingTouchpointRequestAdjuster([2548, 3244, 5677, 8958], [1.02, 1.17, 1.15, 0.94]),
    ],
    [],
    1.9,
    48594.5,
  );
}
