import * as numbers from "../../../../kit/numbers.js";
import { SlaBundle } from "./sla-bundle.js";

/** One step of the sla bundle calculation. */
export interface SlaBundleModifier {
  describe(): string;
  adjust(item: SlaBundle, value: number): number;
}

export class MinimumSlaBundleAdjuster implements SlaBundleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SlaBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingSlaBundleAdjuster implements SlaBundleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SlaBundleOpenRateOffsetAdjuster implements SlaBundleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: SlaBundle, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class ChannelSlaBundleAdjuster implements SlaBundleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: SlaBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the sla bundle steps in order and keeps a trace of each. */
export class SlaBundleEngine {
  steps: SlaBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SlaBundle): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: SlaBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSlaBundleEngine(): SlaBundleEngine {
  return new SlaBundleEngine(
    [
      new MinimumSlaBundleAdjuster(45.4),
      new RoundingSlaBundleAdjuster(0.1),
      new SlaBundleOpenRateOffsetAdjuster(1.09),
      new ChannelSlaBundleAdjuster(new Map<string, number>([["online", 1.06]])),
    ],
    [],
    4.2,
    78945,
  );
}
