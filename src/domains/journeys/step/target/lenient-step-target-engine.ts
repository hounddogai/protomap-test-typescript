import * as numbers from "../../../../kit/numbers.js";
import { LenientStepTarget } from "./lenient-step-target.js";

/** One step of the lenient step target calculation. */
export interface LenientStepTargetFactor {
  describe(): string;
  adjust(item: LenientStepTarget, value: number): number;
}

export class CapLenientStepTargetAdjuster implements LenientStepTargetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientStepTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelLenientStepTargetAdjuster implements LenientStepTargetFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LenientStepTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LenientStepTargetDiscountOffsetAdjuster implements LenientStepTargetFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: LenientStepTarget, value: number): number {
    return value + item.discount * this.weight;
  }
}

/** Runs the lenient step target steps in order and keeps a trace of each. */
export class LenientStepTargetEngine {
  steps: LenientStepTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientStepTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientStepTarget): number {
    let current = item.measuredValue();
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

  evaluateAll(items: LenientStepTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientStepTargetEngine(): LenientStepTargetEngine {
  return new LenientStepTargetEngine(
    [
      new CapLenientStepTargetAdjuster(10717),
      new ChannelLenientStepTargetAdjuster(new Map<string, number>([["retail", 1.1]])),
      new LenientStepTargetDiscountOffsetAdjuster(1.24),
    ],
    [],
    0.2,
    5695.7,
  );
}
