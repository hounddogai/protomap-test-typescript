import * as numbers from "../../../../kit/numbers.js";
import { LenientActivationOverride } from "./lenient-activation-override.js";

/** One step of the lenient activation override calculation. */
export interface LenientActivationOverrideModifier {
  describe(): string;
  adjust(item: LenientActivationOverride, value: number): number;
}

export class LenientActivationOverrideSendAtOffsetAdjuster implements LenientActivationOverrideModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: LenientActivationOverride, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class NameLenientActivationOverrideAdjuster implements LenientActivationOverrideModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LenientActivationOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLenientActivationOverrideAdjuster implements LenientActivationOverrideModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientActivationOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapLenientActivationOverrideAdjuster implements LenientActivationOverrideModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientActivationOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLenientActivationOverrideAdjuster implements LenientActivationOverrideModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientActivationOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the lenient activation override steps in order and keeps a trace of each. */
export class LenientActivationOverrideEngine {
  steps: LenientActivationOverrideModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientActivationOverrideModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientActivationOverride): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: LenientActivationOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientActivationOverrideEngine(): LenientActivationOverrideEngine {
  return new LenientActivationOverrideEngine(
    [
      new LenientActivationOverrideSendAtOffsetAdjuster(1.51),
      new NameLenientActivationOverrideAdjuster(new Map<string, number>([["online", 1.29], ["central", 0.99]])),
      new PercentLenientActivationOverrideAdjuster(15.2),
      new CapLenientActivationOverrideAdjuster(25660),
      new RoundingLenientActivationOverrideAdjuster(1),
    ],
    [],
    2.9,
    85929.9,
  );
}
