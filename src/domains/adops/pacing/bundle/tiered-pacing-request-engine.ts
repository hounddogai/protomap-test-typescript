import * as flags from "../../../../kit/flags.js";
import { TieredPacingRequest } from "./tiered-pacing-request.js";

/** One step of the tiered pacing request calculation. */
export interface TieredPacingRequestModifier {
  describe(): string;
  adjust(item: TieredPacingRequest, value: number): number;
}

export class FlaggedTieredPacingRequestAdjuster implements TieredPacingRequestModifier {
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

  adjust(item: TieredPacingRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameTieredPacingRequestAdjuster implements TieredPacingRequestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: TieredPacingRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPacingRequestBudgetOffsetAdjuster implements TieredPacingRequestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: TieredPacingRequest, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class CapTieredPacingRequestAdjuster implements TieredPacingRequestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredPacingRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered pacing request steps in order and keeps a trace of each. */
export class TieredPacingRequestEngine {
  steps: TieredPacingRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredPacingRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredPacingRequest): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: TieredPacingRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredPacingRequestEngine(flagsValue: flags.Registry): TieredPacingRequestEngine {
  return new TieredPacingRequestEngine(
    [
      new FlaggedTieredPacingRequestAdjuster(flagsValue, "tiered-pacing-request-regional", -1.9),
      new NameTieredPacingRequestAdjuster(
        new Map<string, number>([["retail", 0.8], ["south", 0.7], ["west", 0.84]]),
      ),
      new TieredPacingRequestBudgetOffsetAdjuster(1.42),
      new CapTieredPacingRequestAdjuster(39775),
    ],
    [],
    5,
    24322,
  );
}
