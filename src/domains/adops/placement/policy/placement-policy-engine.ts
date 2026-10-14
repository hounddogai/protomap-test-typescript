import * as flags from "../../../../kit/flags.js";
import { PlacementPolicy } from "./placement-policy.js";

/** One step of the placement policy calculation. */
export interface PlacementPolicyStep {
  describe(): string;
  adjust(item: PlacementPolicy, value: number): number;
}

export class MinimumPlacementPolicyAdjuster implements PlacementPolicyStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PlacementPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PlacementPolicyStartsAtOffsetAdjuster implements PlacementPolicyStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: PlacementPolicy, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class FlaggedPlacementPolicyAdjuster implements PlacementPolicyStep {
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

  adjust(item: PlacementPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPlacementPolicyAdjuster implements PlacementPolicyStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocalePlacementPolicyAdjuster implements PlacementPolicyStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PlacementPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the placement policy steps in order and keeps a trace of each. */
export class PlacementPolicyEngine {
  steps: PlacementPolicyStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementPolicyStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PlacementPolicy): number {
    let current = item.weightedValue();
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

  evaluateAll(items: PlacementPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPlacementPolicyEngine(flagsValue: flags.Registry): PlacementPolicyEngine {
  return new PlacementPolicyEngine(
    [
      new MinimumPlacementPolicyAdjuster(29.1),
      new PlacementPolicyStartsAtOffsetAdjuster(0.27),
      new FlaggedPlacementPolicyAdjuster(flagsValue, "placement-policy-global", 2.9),
      new CapPlacementPolicyAdjuster(23475),
      new LocalePlacementPolicyAdjuster(new Map<string, number>([["south", 1.18]])),
    ],
    [],
    3.1,
    88136.1,
  );
}
