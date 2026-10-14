import * as flags from "../../../../kit/flags.js";
import { PrimaryPathDraft } from "./primary-path-draft.js";

/** One step of the primary path draft calculation. */
export interface PrimaryPathDraftModifier {
  describe(): string;
  adjust(item: PrimaryPathDraft, value: number): number;
}

export class CapPrimaryPathDraftAdjuster implements PrimaryPathDraftModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryPathDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocalePrimaryPathDraftAdjuster implements PrimaryPathDraftModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PrimaryPathDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPrimaryPathDraftAdjuster implements PrimaryPathDraftModifier {
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

  adjust(item: PrimaryPathDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPrimaryPathDraftAdjuster implements PrimaryPathDraftModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryPathDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the primary path draft steps in order and keeps a trace of each. */
export class PrimaryPathDraftEngine {
  steps: PrimaryPathDraftModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryPathDraftModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryPathDraft): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PrimaryPathDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryPathDraftEngine(flagsValue: flags.Registry): PrimaryPathDraftEngine {
  return new PrimaryPathDraftEngine(
    [
      new CapPrimaryPathDraftAdjuster(22661),
      new LocalePrimaryPathDraftAdjuster(
        new Map<string, number>([["west", 0.84], ["online", 1.25], ["retail", 0.82]]),
      ),
      new FlaggedPrimaryPathDraftAdjuster(flagsValue, "primary-path-draft-seasonal", 3.8),
      new MinimumPrimaryPathDraftAdjuster(7.7),
    ],
    [],
    1,
    34389.4,
  );
}
