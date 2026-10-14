import * as numbers from "../../../../kit/numbers.js";
import { ModelBundle } from "./model-bundle.js";

/** One step of the model bundle calculation. */
export interface ModelBundleFactor {
  describe(): string;
  adjust(item: ModelBundle, value: number): number;
}

export class RoundingModelBundleAdjuster implements ModelBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ModelBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentModelBundleAdjuster implements ModelBundleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ModelBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ModelBundleSequenceOffsetAdjuster implements ModelBundleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: ModelBundle, value: number): number {
    return value + item.sequence * this.weight;
  }
}

/** Runs the model bundle steps in order and keeps a trace of each. */
export class ModelBundleEngine {
  steps: ModelBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ModelBundle): number {
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

  evaluateAll(items: ModelBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultModelBundleEngine(): ModelBundleEngine {
  return new ModelBundleEngine(
    [
      new RoundingModelBundleAdjuster(5),
      new PercentModelBundleAdjuster(9.5),
      new ModelBundleSequenceOffsetAdjuster(1.14),
    ],
    [],
    4.5,
    54941.2,
  );
}
