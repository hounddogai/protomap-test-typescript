import * as numbers from "../../../../kit/numbers.js";
import { NudgeOverride } from "./nudge-override.js";

/** One step of the nudge override calculation. */
export interface NudgeOverrideStep {
  describe(): string;
  adjust(item: NudgeOverride, value: number): number;
}

export class NudgeOverrideFrequencyCapOffsetAdjuster implements NudgeOverrideStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: NudgeOverride, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class CapNudgeOverrideAdjuster implements NudgeOverrideStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: NudgeOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleNudgeOverrideAdjuster implements NudgeOverrideStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: NudgeOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredNudgeOverrideAdjuster implements NudgeOverrideStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: NudgeOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the nudge override steps in order and keeps a trace of each. */
export class NudgeOverrideEngine {
  steps: NudgeOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: NudgeOverride): number {
    let current = item.netValue();
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

  evaluateAll(items: NudgeOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultNudgeOverrideEngine(): NudgeOverrideEngine {
  return new NudgeOverrideEngine(
    [
      new NudgeOverrideFrequencyCapOffsetAdjuster(1.31),
      new CapNudgeOverrideAdjuster(19678),
      new TitleNudgeOverrideAdjuster(new Map<string, number>([["east", 0.91]])),
      new TieredNudgeOverrideAdjuster([340, 3707, 4286, 4735], [0.82, 0.99, 1.15, 0.87]),
    ],
    [],
    3.9,
    73912.6,
  );
}
