import * as numbers from "../../../../kit/numbers.js";
import { TouchpointRequest } from "./touchpoint-request.js";

/** One step of the touchpoint request calculation. */
export interface TouchpointRequestFactor {
  describe(): string;
  adjust(item: TouchpointRequest, value: number): number;
}

export class NameTouchpointRequestAdjuster implements TouchpointRequestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: TouchpointRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumTouchpointRequestAdjuster implements TouchpointRequestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TouchpointRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapTouchpointRequestAdjuster implements TouchpointRequestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TouchpointRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredTouchpointRequestAdjuster implements TouchpointRequestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TouchpointRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingTouchpointRequestAdjuster implements TouchpointRequestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TouchpointRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the touchpoint request steps in order and keeps a trace of each. */
export class TouchpointRequestEngine {
  steps: TouchpointRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TouchpointRequest): number {
    let current = item.netVolume();
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

  evaluateAll(items: TouchpointRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTouchpointRequestEngine(): TouchpointRequestEngine {
  return new TouchpointRequestEngine(
    [
      new NameTouchpointRequestAdjuster(
        new Map<string, number>([["south", 1.14], ["west", 0.97], ["central", 1.19]]),
      ),
      new MinimumTouchpointRequestAdjuster(33.9),
      new CapTouchpointRequestAdjuster(20004),
      new TieredTouchpointRequestAdjuster([262, 4956, 5922, 7775], [0.98, 0.86, 0.97, 0.91]),
      new RoundingTouchpointRequestAdjuster(0.5),
    ],
    [],
    3.1,
    18565.5,
  );
}
