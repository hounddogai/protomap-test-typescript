import * as numbers from "../../../../kit/numbers.js";
import { DefaultMentionOverride } from "./default-mention-override.js";

/** One step of the default mention override calculation. */
export interface DefaultMentionOverrideFactor {
  describe(): string;
  adjust(item: DefaultMentionOverride, value: number): number;
}

export class RoundingDefaultMentionOverrideAdjuster implements DefaultMentionOverrideFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultMentionOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredDefaultMentionOverrideAdjuster implements DefaultMentionOverrideFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultMentionOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumDefaultMentionOverrideAdjuster implements DefaultMentionOverrideFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultMentionOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the default mention override steps in order and keeps a trace of each. */
export class DefaultMentionOverrideEngine {
  steps: DefaultMentionOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultMentionOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultMentionOverride): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: DefaultMentionOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultMentionOverrideEngine(): DefaultMentionOverrideEngine {
  return new DefaultMentionOverrideEngine(
    [
      new RoundingDefaultMentionOverrideAdjuster(0.05),
      new TieredDefaultMentionOverrideAdjuster([429, 500, 4352, 4742], [1.17, 0.96, 0.81, 0.97]),
      new MinimumDefaultMentionOverrideAdjuster(9.7),
    ],
    [],
    4.8,
    54067.8,
  );
}
