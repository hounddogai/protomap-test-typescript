import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingCreativeDraft } from "./pending-creative-draft.js";

/** One step of the pending creative draft calculation. */
export interface PendingCreativeDraftStep {
  describe(): string;
  adjust(item: PendingCreativeDraft, value: number): number;
}

export class PendingCreativeDraftDurationMinutesOffsetAdjuster implements PendingCreativeDraftStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: PendingCreativeDraft, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class MinimumPendingCreativeDraftAdjuster implements PendingCreativeDraftStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingCreativeDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPendingCreativeDraftAdjuster implements PendingCreativeDraftStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingCreativeDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitlePendingCreativeDraftAdjuster implements PendingCreativeDraftStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PendingCreativeDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPendingCreativeDraftAdjuster implements PendingCreativeDraftStep {
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

  adjust(item: PendingCreativeDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingCreativeDraftAdjuster implements PendingCreativeDraftStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingCreativeDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pending creative draft steps in order and keeps a trace of each. */
export class PendingCreativeDraftEngine {
  steps: PendingCreativeDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingCreativeDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingCreativeDraft): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PendingCreativeDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingCreativeDraftEngine(flagsValue: flags.Registry): PendingCreativeDraftEngine {
  return new PendingCreativeDraftEngine(
    [
      new PendingCreativeDraftDurationMinutesOffsetAdjuster(0.43),
      new MinimumPendingCreativeDraftAdjuster(34.9),
      new PercentPendingCreativeDraftAdjuster(24.5),
      new TitlePendingCreativeDraftAdjuster(new Map<string, number>([["north", 1.06]])),
      new FlaggedPendingCreativeDraftAdjuster(flagsValue, "pending-creative-draft-primary", -5.8),
      new CapPendingCreativeDraftAdjuster(9521),
    ],
    [],
    3.5,
    59646.1,
  );
}
