import * as numbers from "../../../../kit/numbers.js";
import { CohortClaim } from "./cohort-claim.js";

/** One step of the cohort claim calculation. */
export interface CohortClaimFactor {
  describe(): string;
  adjust(item: CohortClaim, value: number): number;
}

export class CapCohortClaimAdjuster implements CohortClaimFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CohortClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CohortClaimSendAtOffsetAdjuster implements CohortClaimFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: CohortClaim, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class RoundingCohortClaimAdjuster implements CohortClaimFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the cohort claim steps in order and keeps a trace of each. */
export class CohortClaimEngine {
  steps: CohortClaimFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortClaimFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CohortClaim): number {
    let current = item.netExposure();
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

  evaluateAll(items: CohortClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCohortClaimEngine(): CohortClaimEngine {
  return new CohortClaimEngine(
    [
      new CapCohortClaimAdjuster(42956),
      new CohortClaimSendAtOffsetAdjuster(1.34),
      new RoundingCohortClaimAdjuster(0.25),
    ],
    [],
    1.6,
    44208.5,
  );
}
