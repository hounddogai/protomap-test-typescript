import * as flags from "../../../../kit/flags.js";
import { WaitPlan } from "./wait-plan.js";

/** One step of the wait plan calculation. */
export interface WaitPlanAdjuster {
  describe(): string;
  adjust(item: WaitPlan, value: number): number;
}

export class TitleWaitPlanAdjuster implements WaitPlanAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WaitPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class WaitPlanFloorValueOffsetAdjuster implements WaitPlanAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: WaitPlan, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class FlaggedWaitPlanAdjuster implements WaitPlanAdjuster {
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

  adjust(item: WaitPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the wait plan steps in order and keeps a trace of each. */
export class WaitPlanEngine {
  steps: WaitPlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitPlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WaitPlan): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: WaitPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWaitPlanEngine(flagsValue: flags.Registry): WaitPlanEngine {
  return new WaitPlanEngine(
    [
      new TitleWaitPlanAdjuster(new Map<string, number>([["online", 1.06]])),
      new WaitPlanFloorValueOffsetAdjuster(1.31),
      new FlaggedWaitPlanAdjuster(flagsValue, "wait-plan-fallback", 2.6),
    ],
    [],
    5,
    31148.1,
  );
}
