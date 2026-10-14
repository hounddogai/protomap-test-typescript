import * as numbers from "../../../../kit/numbers.js";
import { ProofDraft } from "./proof-draft.js";

/** One step of the proof draft calculation. */
export interface ProofDraftModifier {
  describe(): string;
  adjust(item: ProofDraft, value: number): number;
}

export class PercentProofDraftAdjuster implements ProofDraftModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ProofDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingProofDraftAdjuster implements ProofDraftModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumProofDraftAdjuster implements ProofDraftModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapProofDraftAdjuster implements ProofDraftModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the proof draft steps in order and keeps a trace of each. */
export class ProofDraftEngine {
  steps: ProofDraftModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofDraftModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ProofDraft): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ProofDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultProofDraftEngine(): ProofDraftEngine {
  return new ProofDraftEngine(
    [
      new PercentProofDraftAdjuster(11.2),
      new RoundingProofDraftAdjuster(0.25),
      new MinimumProofDraftAdjuster(31.8),
      new CapProofDraftAdjuster(17417),
    ],
    [],
    3.2,
    10581.4,
  );
}
