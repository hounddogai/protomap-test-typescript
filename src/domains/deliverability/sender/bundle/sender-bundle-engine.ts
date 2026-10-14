import * as numbers from "../../../../kit/numbers.js";
import { SenderBundle } from "./sender-bundle.js";

/** One step of the sender bundle calculation. */
export interface SenderBundleModifier {
  describe(): string;
  adjust(item: SenderBundle, value: number): number;
}

export class PercentSenderBundleAdjuster implements SenderBundleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SenderBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SenderBundleCeilingOffsetAdjuster implements SenderBundleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: SenderBundle, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class RoundingSenderBundleAdjuster implements SenderBundleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SenderBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSenderBundleAdjuster implements SenderBundleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SenderBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the sender bundle steps in order and keeps a trace of each. */
export class SenderBundleEngine {
  steps: SenderBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SenderBundle): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: SenderBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSenderBundleEngine(): SenderBundleEngine {
  return new SenderBundleEngine(
    [
      new PercentSenderBundleAdjuster(16.4),
      new SenderBundleCeilingOffsetAdjuster(1.76),
      new RoundingSenderBundleAdjuster(0.5),
      new TieredSenderBundleAdjuster([4722, 8909], [1.18, 0.97]),
    ],
    [],
    1.6,
    6791.6,
  );
}
