import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckDraft } from "./fraud-check-draft.js";

/** One step of the fraud check draft calculation. */
export interface FraudCheckDraftFactor {
  describe(): string;
  adjust(item: FraudCheckDraft, value: number): number;
}

export class PercentFraudCheckDraftAdjuster implements FraudCheckDraftFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FraudCheckDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFraudCheckDraftAdjuster implements FraudCheckDraftFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FraudCheckDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedFraudCheckDraftAdjuster implements FraudCheckDraftFactor {
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

  adjust(item: FraudCheckDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFraudCheckDraftAdjuster implements FraudCheckDraftFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FraudCheckDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fraud check draft steps in order and keeps a trace of each. */
export class FraudCheckDraftEngine {
  steps: FraudCheckDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FraudCheckDraft): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: FraudCheckDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFraudCheckDraftEngine(flagsValue: flags.Registry): FraudCheckDraftEngine {
  return new FraudCheckDraftEngine(
    [
      new PercentFraudCheckDraftAdjuster(-12.8),
      new MinimumFraudCheckDraftAdjuster(20.2),
      new FlaggedFraudCheckDraftAdjuster(flagsValue, "fraud-check-draft-scheduled", 6.4),
      new RoundingFraudCheckDraftAdjuster(5),
    ],
    [],
    2.3,
    60758.3,
  );
}
