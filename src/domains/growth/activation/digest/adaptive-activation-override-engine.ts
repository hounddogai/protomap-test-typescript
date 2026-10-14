import { AdaptiveActivationOverride } from "./adaptive-activation-override.js";

/** One step of the adaptive activation override calculation. */
export interface AdaptiveActivationOverrideModifier {
  describe(): string;
  adjust(item: AdaptiveActivationOverride, value: number): number;
}

export class PercentAdaptiveActivationOverrideAdjuster implements AdaptiveActivationOverrideModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveActivationOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapAdaptiveActivationOverrideAdjuster implements AdaptiveActivationOverrideModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveActivationOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumAdaptiveActivationOverrideAdjuster implements AdaptiveActivationOverrideModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveActivationOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class AdaptiveActivationOverrideEndsAtOffsetAdjuster implements AdaptiveActivationOverrideModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: AdaptiveActivationOverride, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

/** Runs the adaptive activation override steps in order and keeps a trace of each. */
export class AdaptiveActivationOverrideEngine {
  steps: AdaptiveActivationOverrideModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveActivationOverrideModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveActivationOverride): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: AdaptiveActivationOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveActivationOverrideEngine(): AdaptiveActivationOverrideEngine {
  return new AdaptiveActivationOverrideEngine(
    [
      new PercentAdaptiveActivationOverrideAdjuster(-21.9),
      new CapAdaptiveActivationOverrideAdjuster(1566),
      new MinimumAdaptiveActivationOverrideAdjuster(22.8),
      new AdaptiveActivationOverrideEndsAtOffsetAdjuster(0.54),
    ],
    [],
    0.5,
    19093.6,
  );
}
