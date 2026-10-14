import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedPlacementTemplate } from "./batched-placement-template.js";

/** One step of the batched placement template calculation. */
export interface BatchedPlacementTemplateFactor {
  describe(): string;
  adjust(item: BatchedPlacementTemplate, value: number): number;
}

export class CapBatchedPlacementTemplateAdjuster implements BatchedPlacementTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedPlacementTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingBatchedPlacementTemplateAdjuster implements BatchedPlacementTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedPlacementTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumBatchedPlacementTemplateAdjuster implements BatchedPlacementTemplateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedPlacementTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class BatchedPlacementTemplateDiscountOffsetAdjuster implements BatchedPlacementTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: BatchedPlacementTemplate, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class FlaggedBatchedPlacementTemplateAdjuster implements BatchedPlacementTemplateFactor {
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

  adjust(item: BatchedPlacementTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched placement template steps in order and keeps a trace of each. */
export class BatchedPlacementTemplateEngine {
  steps: BatchedPlacementTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedPlacementTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedPlacementTemplate): number {
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

  evaluateAll(items: BatchedPlacementTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedPlacementTemplateEngine(flagsValue: flags.Registry): BatchedPlacementTemplateEngine {
  return new BatchedPlacementTemplateEngine(
    [
      new CapBatchedPlacementTemplateAdjuster(6388),
      new RoundingBatchedPlacementTemplateAdjuster(0.05),
      new MinimumBatchedPlacementTemplateAdjuster(38.9),
      new BatchedPlacementTemplateDiscountOffsetAdjuster(1.15),
      new FlaggedBatchedPlacementTemplateAdjuster(flagsValue, "batched-placement-template-legacy", 0.7),
    ],
    [],
    1.8,
    53898.2,
  );
}
