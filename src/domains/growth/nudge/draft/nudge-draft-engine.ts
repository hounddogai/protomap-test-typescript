import * as numbers from "../../../../kit/numbers.js";
import { NudgeDraft } from "./nudge-draft.js";

/** One step of the nudge draft calculation. */
export interface NudgeDraftModifier {
  describe(): string;
  adjust(item: NudgeDraft, value: number): number;
}

export class NudgeDraftScoreOffsetAdjuster implements NudgeDraftModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: NudgeDraft, value: number): number {
    return value + item.score * this.weight;
  }
}

export class TitleNudgeDraftAdjuster implements NudgeDraftModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: NudgeDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingNudgeDraftAdjuster implements NudgeDraftModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: NudgeDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumNudgeDraftAdjuster implements NudgeDraftModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: NudgeDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the nudge draft steps in order and keeps a trace of each. */
export class NudgeDraftEngine {
  steps: NudgeDraftModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeDraftModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: NudgeDraft): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: NudgeDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultNudgeDraftEngine(): NudgeDraftEngine {
  return new NudgeDraftEngine(
    [
      new NudgeDraftScoreOffsetAdjuster(1.66),
      new TitleNudgeDraftAdjuster(new Map<string, number>([["south", 1.28]])),
      new RoundingNudgeDraftAdjuster(0.5),
      new MinimumNudgeDraftAdjuster(22.5),
    ],
    [],
    4.9,
    32552.3,
  );
}
