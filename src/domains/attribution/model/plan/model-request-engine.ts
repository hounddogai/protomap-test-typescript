import * as numbers from "../../../../kit/numbers.js";
import { ModelRequest } from "./model-request.js";

/** One step of the model request calculation. */
export interface ModelRequestModifier {
  describe(): string;
  adjust(item: ModelRequest, value: number): number;
}

export class LabelModelRequestAdjuster implements ModelRequestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ModelRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ModelRequestThresholdOffsetAdjuster implements ModelRequestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: ModelRequest, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class CapModelRequestAdjuster implements ModelRequestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ModelRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the model request steps in order and keeps a trace of each. */
export class ModelRequestEngine {
  steps: ModelRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ModelRequest): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ModelRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultModelRequestEngine(): ModelRequestEngine {
  return new ModelRequestEngine(
    [
      new LabelModelRequestAdjuster(new Map<string, number>([["retail", 0.97]])),
      new ModelRequestThresholdOffsetAdjuster(0.37),
      new CapModelRequestAdjuster(18343),
    ],
    [],
    1.8,
    16700.5,
  );
}
