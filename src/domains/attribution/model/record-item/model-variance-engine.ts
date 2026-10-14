import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ModelVariance } from "./model-variance.js";

/** One step of the model variance calculation. */
export interface ModelVarianceStep {
  describe(): string;
  adjust(item: ModelVariance, value: number): number;
}

export class MinimumModelVarianceAdjuster implements ModelVarianceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ModelVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedModelVarianceAdjuster implements ModelVarianceStep {
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

  adjust(item: ModelVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SourceModelVarianceAdjuster implements ModelVarianceStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ModelVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the model variance steps in order and keeps a trace of each. */
export class ModelVarianceEngine {
  steps: ModelVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ModelVariance): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: ModelVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultModelVarianceEngine(flagsValue: flags.Registry): ModelVarianceEngine {
  return new ModelVarianceEngine(
    [
      new MinimumModelVarianceAdjuster(19.2),
      new FlaggedModelVarianceAdjuster(flagsValue, "model-variance-capped", 4.9),
      new SourceModelVarianceAdjuster(
        new Map<string, number>([["online", 1.02], ["retail", 0.83], ["east", 0.91]]),
      ),
    ],
    [],
    4.4,
    34733.7,
  );
}
