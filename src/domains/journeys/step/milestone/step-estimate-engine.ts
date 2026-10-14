import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StepEstimate } from "./step-estimate.js";

/** One step of the step estimate calculation. */
export interface StepEstimateFactor {
  describe(): string;
  adjust(item: StepEstimate, value: number): number;
}

export class FlaggedStepEstimateAdjuster implements StepEstimateFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: StepEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class StepEstimateMarginOffsetAdjuster implements StepEstimateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: StepEstimate, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class NameStepEstimateAdjuster implements StepEstimateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: StepEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredStepEstimateAdjuster implements StepEstimateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StepEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the step estimate steps in order and keeps a trace of each. */
export class StepEstimateEngine {
  steps: StepEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StepEstimate): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: StepEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStepEstimateEngine(flagsValue: flags.Registry): StepEstimateEngine {
  return new StepEstimateEngine(
    [
      new FlaggedStepEstimateAdjuster(flagsValue, "step-estimate-seasonal", 4.8),
      new StepEstimateMarginOffsetAdjuster(0.09),
      new NameStepEstimateAdjuster(new Map<string, number>([["central", 0.83]])),
      new TieredStepEstimateAdjuster([549, 5281, 7390], [0.94, 0.88, 0.83]),
    ],
    [],
    0.6,
    82249.6,
  );
}
