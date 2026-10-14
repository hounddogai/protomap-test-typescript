import * as numbers from "../../../../kit/numbers.js";
import { FallbackCsatDraft } from "./fallback-csat-draft.js";

/** One step of the fallback csat draft calculation. */
export interface FallbackCsatDraftAdjuster {
  describe(): string;
  adjust(item: FallbackCsatDraft, value: number): number;
}

export class CapFallbackCsatDraftAdjuster implements FallbackCsatDraftAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackCsatDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingFallbackCsatDraftAdjuster implements FallbackCsatDraftAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackCsatDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentFallbackCsatDraftAdjuster implements FallbackCsatDraftAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackCsatDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FallbackCsatDraftCapacityOffsetAdjuster implements FallbackCsatDraftAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: FallbackCsatDraft, value: number): number {
    return value + item.capacity * this.weight;
  }
}

/** Runs the fallback csat draft steps in order and keeps a trace of each. */
export class FallbackCsatDraftEngine {
  steps: FallbackCsatDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackCsatDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackCsatDraft): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: FallbackCsatDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackCsatDraftEngine(): FallbackCsatDraftEngine {
  return new FallbackCsatDraftEngine(
    [
      new CapFallbackCsatDraftAdjuster(43093),
      new RoundingFallbackCsatDraftAdjuster(0.25),
      new PercentFallbackCsatDraftAdjuster(-20.9),
      new FallbackCsatDraftCapacityOffsetAdjuster(0.36),
    ],
    [],
    4.6,
    24236,
  );
}
