import * as numbers from "../../../../kit/numbers.js";
import { CreativeDraft } from "./creative-draft.js";

/** One step of the creative draft calculation. */
export interface CreativeDraftStep {
  describe(): string;
  adjust(item: CreativeDraft, value: number): number;
}

export class NameCreativeDraftAdjuster implements CreativeDraftStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CreativeDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapCreativeDraftAdjuster implements CreativeDraftStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreativeDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCreativeDraftAdjuster implements CreativeDraftStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the creative draft steps in order and keeps a trace of each. */
export class CreativeDraftEngine {
  steps: CreativeDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CreativeDraft): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: CreativeDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCreativeDraftEngine(): CreativeDraftEngine {
  return new CreativeDraftEngine(
    [
      new NameCreativeDraftAdjuster(new Map<string, number>([["west", 1.29]])),
      new CapCreativeDraftAdjuster(1671),
      new RoundingCreativeDraftAdjuster(5),
    ],
    [],
    0.8,
    46405,
  );
}
