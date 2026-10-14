import * as numbers from "../../../../kit/numbers.js";
import { ComplaintRequest } from "./complaint-request.js";

/** One step of the complaint request calculation. */
export interface ComplaintRequestStep {
  describe(): string;
  adjust(item: ComplaintRequest, value: number): number;
}

export class TitleComplaintRequestAdjuster implements ComplaintRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ComplaintRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapComplaintRequestAdjuster implements ComplaintRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ComplaintRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ComplaintRequestRateOffsetAdjuster implements ComplaintRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: ComplaintRequest, value: number): number {
    return value + item.rate * this.weight;
  }
}

/** Runs the complaint request steps in order and keeps a trace of each. */
export class ComplaintRequestEngine {
  steps: ComplaintRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ComplaintRequest): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: ComplaintRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultComplaintRequestEngine(): ComplaintRequestEngine {
  return new ComplaintRequestEngine(
    [
      new TitleComplaintRequestAdjuster(
        new Map<string, number>([["central", 0.79], ["online", 1.29], ["south", 1.24]]),
      ),
      new CapComplaintRequestAdjuster(27904),
      new ComplaintRequestRateOffsetAdjuster(1.08),
    ],
    [],
    0.6,
    46020.2,
  );
}
