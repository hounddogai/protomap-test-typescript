import * as numbers from "../../../../kit/numbers.js";
import { FrequencyEntry } from "./frequency-entry.js";

/** One step of the frequency entry calculation. */
export interface FrequencyEntryStep {
  describe(): string;
  adjust(item: FrequencyEntry, value: number): number;
}

export class FrequencyEntryThresholdOffsetAdjuster implements FrequencyEntryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: FrequencyEntry, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class RoundingFrequencyEntryAdjuster implements FrequencyEntryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FrequencyEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelFrequencyEntryAdjuster implements FrequencyEntryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FrequencyEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the frequency entry steps in order and keeps a trace of each. */
export class FrequencyEntryEngine {
  steps: FrequencyEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FrequencyEntry): number {
    let current = item.netTotal();
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

  evaluateAll(items: FrequencyEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFrequencyEntryEngine(): FrequencyEntryEngine {
  return new FrequencyEntryEngine(
    [
      new FrequencyEntryThresholdOffsetAdjuster(1.75),
      new RoundingFrequencyEntryAdjuster(0.1),
      new LabelFrequencyEntryAdjuster(new Map<string, number>([["north", 1.32], ["east", 0.72]])),
    ],
    [],
    1.8,
    91016.5,
  );
}
