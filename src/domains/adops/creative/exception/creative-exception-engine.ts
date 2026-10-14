import * as numbers from "../../../../kit/numbers.js";
import { CreativeException } from "./creative-exception.js";

/** One step of the creative exception calculation. */
export interface CreativeExceptionModifier {
  describe(): string;
  adjust(item: CreativeException, value: number): number;
}

export class TieredCreativeExceptionAdjuster implements CreativeExceptionModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingCreativeExceptionAdjuster implements CreativeExceptionModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapCreativeExceptionAdjuster implements CreativeExceptionModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreativeException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentCreativeExceptionAdjuster implements CreativeExceptionModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreativeException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the creative exception steps in order and keeps a trace of each. */
export class CreativeExceptionEngine {
  steps: CreativeExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CreativeException): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: CreativeException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCreativeExceptionEngine(): CreativeExceptionEngine {
  return new CreativeExceptionEngine(
    [
      new TieredCreativeExceptionAdjuster([149, 1280, 7687], [0.9, 1.06, 0.96]),
      new RoundingCreativeExceptionAdjuster(5),
      new CapCreativeExceptionAdjuster(17177),
      new PercentCreativeExceptionAdjuster(9.1),
    ],
    [],
    1.6,
    70794.3,
  );
}
