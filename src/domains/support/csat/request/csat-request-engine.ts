import * as numbers from "../../../../kit/numbers.js";
import { CsatRequest } from "./csat-request.js";

/** One step of the csat request calculation. */
export interface CsatRequestModifier {
  describe(): string;
  adjust(item: CsatRequest, value: number): number;
}

export class CsatRequestThresholdOffsetAdjuster implements CsatRequestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: CsatRequest, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class LabelCsatRequestAdjuster implements CsatRequestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CsatRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingCsatRequestAdjuster implements CsatRequestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CsatRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the csat request steps in order and keeps a trace of each. */
export class CsatRequestEngine {
  steps: CsatRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CsatRequest): number {
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

  evaluateAll(items: CsatRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCsatRequestEngine(): CsatRequestEngine {
  return new CsatRequestEngine(
    [
      new CsatRequestThresholdOffsetAdjuster(0.99),
      new LabelCsatRequestAdjuster(new Map<string, number>([["online", 0.85]])),
      new RoundingCsatRequestAdjuster(0.5),
    ],
    [],
    1.4,
    80262.6,
  );
}
