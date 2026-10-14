import * as numbers from "../../../../kit/numbers.js";
import { ApprovalDraft } from "./approval-draft.js";

/** One step of the approval draft calculation. */
export interface ApprovalDraftAdjuster {
  describe(): string;
  adjust(item: ApprovalDraft, value: number): number;
}

export class TitleApprovalDraftAdjuster implements ApprovalDraftAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ApprovalDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredApprovalDraftAdjuster implements ApprovalDraftAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ApprovalDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentApprovalDraftAdjuster implements ApprovalDraftAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the approval draft steps in order and keeps a trace of each. */
export class ApprovalDraftEngine {
  steps: ApprovalDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ApprovalDraft): number {
    let current = item.projectedValue();
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

  evaluateAll(items: ApprovalDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultApprovalDraftEngine(): ApprovalDraftEngine {
  return new ApprovalDraftEngine(
    [
      new TitleApprovalDraftAdjuster(new Map<string, number>([["online", 1.27]])),
      new TieredApprovalDraftAdjuster([3558, 4140, 6579, 8440], [1.03, 0.91, 1.08, 1]),
      new PercentApprovalDraftAdjuster(-15.6),
    ],
    [],
    2.1,
    87496.4,
  );
}
