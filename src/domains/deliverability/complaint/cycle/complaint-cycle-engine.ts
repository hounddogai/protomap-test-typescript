import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ComplaintCycle } from "./complaint-cycle.js";

/** One step of the complaint cycle calculation. */
export interface ComplaintCycleModifier {
  describe(): string;
  adjust(item: ComplaintCycle, value: number): number;
}

export class ChannelComplaintCycleAdjuster implements ComplaintCycleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ComplaintCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingComplaintCycleAdjuster implements ComplaintCycleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ComplaintCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ComplaintCycleFloorValueOffsetAdjuster implements ComplaintCycleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: ComplaintCycle, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class FlaggedComplaintCycleAdjuster implements ComplaintCycleModifier {
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

  adjust(item: ComplaintCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapComplaintCycleAdjuster implements ComplaintCycleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ComplaintCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the complaint cycle steps in order and keeps a trace of each. */
export class ComplaintCycleEngine {
  steps: ComplaintCycleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintCycleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ComplaintCycle): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: ComplaintCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultComplaintCycleEngine(flagsValue: flags.Registry): ComplaintCycleEngine {
  return new ComplaintCycleEngine(
    [
      new ChannelComplaintCycleAdjuster(new Map<string, number>([["west", 1.29]])),
      new RoundingComplaintCycleAdjuster(0.25),
      new ComplaintCycleFloorValueOffsetAdjuster(0.28),
      new FlaggedComplaintCycleAdjuster(flagsValue, "complaint-cycle-legacy", 5.8),
      new CapComplaintCycleAdjuster(15802),
    ],
    [],
    1.5,
    99540.4,
  );
}
