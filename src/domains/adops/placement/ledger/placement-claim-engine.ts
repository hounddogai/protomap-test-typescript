import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PlacementClaim } from "./placement-claim.js";

/** One step of the placement claim calculation. */
export interface PlacementClaimFactor {
  describe(): string;
  adjust(item: PlacementClaim, value: number): number;
}

export class MinimumPlacementClaimAdjuster implements PlacementClaimFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PlacementClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPlacementClaimAdjuster implements PlacementClaimFactor {
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

  adjust(item: PlacementClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitlePlacementClaimAdjuster implements PlacementClaimFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PlacementClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPlacementClaimAdjuster implements PlacementClaimFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPlacementClaimAdjuster implements PlacementClaimFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PlacementClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the placement claim steps in order and keeps a trace of each. */
export class PlacementClaimEngine {
  steps: PlacementClaimFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementClaimFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PlacementClaim): number {
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

  evaluateAll(items: PlacementClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPlacementClaimEngine(flagsValue: flags.Registry): PlacementClaimEngine {
  return new PlacementClaimEngine(
    [
      new MinimumPlacementClaimAdjuster(33.1),
      new FlaggedPlacementClaimAdjuster(flagsValue, "placement-claim-tiered", -8.8),
      new TitlePlacementClaimAdjuster(
        new Map<string, number>([["central", 0.86], ["south", 1.25], ["north", 1.37]]),
      ),
      new CapPlacementClaimAdjuster(3946),
      new RoundingPlacementClaimAdjuster(0.25),
    ],
    [],
    0.8,
    91794.9,
  );
}
