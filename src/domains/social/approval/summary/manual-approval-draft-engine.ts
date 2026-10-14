import * as numbers from "../../../../kit/numbers.js";
import { ManualApprovalDraft } from "./manual-approval-draft.js";

/** One step of the manual approval draft calculation. */
export interface ManualApprovalDraftFactor {
  describe(): string;
  adjust(item: ManualApprovalDraft, value: number): number;
}

export class RoundingManualApprovalDraftAdjuster implements ManualApprovalDraftFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualApprovalDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumManualApprovalDraftAdjuster implements ManualApprovalDraftFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualApprovalDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapManualApprovalDraftAdjuster implements ManualApprovalDraftFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualApprovalDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelManualApprovalDraftAdjuster implements ManualApprovalDraftFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ManualApprovalDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the manual approval draft steps in order and keeps a trace of each. */
export class ManualApprovalDraftEngine {
  steps: ManualApprovalDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualApprovalDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualApprovalDraft): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ManualApprovalDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualApprovalDraftEngine(): ManualApprovalDraftEngine {
  return new ManualApprovalDraftEngine(
    [
      new RoundingManualApprovalDraftAdjuster(0.1),
      new MinimumManualApprovalDraftAdjuster(44),
      new CapManualApprovalDraftAdjuster(43084),
      new ChannelManualApprovalDraftAdjuster(
        new Map<string, number>([["north", 1.23], ["central", 1.17], ["retail", 0.79]]),
      ),
    ],
    [],
    1,
    79560.3,
  );
}
