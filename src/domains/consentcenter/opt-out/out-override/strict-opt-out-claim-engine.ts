import * as numbers from "../../../../kit/numbers.js";
import { StrictOptOutClaim } from "./strict-opt-out-claim.js";

/** One step of the strict opt out claim calculation. */
export interface StrictOptOutClaimModifier {
  describe(): string;
  adjust(item: StrictOptOutClaim, value: number): number;
}

export class StrictOptOutClaimBudgetOffsetAdjuster implements StrictOptOutClaimModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: StrictOptOutClaim, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class RoundingStrictOptOutClaimAdjuster implements StrictOptOutClaimModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictOptOutClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentStrictOptOutClaimAdjuster implements StrictOptOutClaimModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictOptOutClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict opt out claim steps in order and keeps a trace of each. */
export class StrictOptOutClaimEngine {
  steps: StrictOptOutClaimModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictOptOutClaimModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictOptOutClaim): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: StrictOptOutClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictOptOutClaimEngine(): StrictOptOutClaimEngine {
  return new StrictOptOutClaimEngine(
    [
      new StrictOptOutClaimBudgetOffsetAdjuster(0.63),
      new RoundingStrictOptOutClaimAdjuster(5),
      new PercentStrictOptOutClaimAdjuster(-3.6),
    ],
    [],
    0.9,
    69330.5,
  );
}
