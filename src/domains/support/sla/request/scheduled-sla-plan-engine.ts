import * as flags from "../../../../kit/flags.js";
import { ScheduledSlaPlan } from "./scheduled-sla-plan.js";

/** One step of the scheduled sla plan calculation. */
export interface ScheduledSlaPlanModifier {
  describe(): string;
  adjust(item: ScheduledSlaPlan, value: number): number;
}

export class PercentScheduledSlaPlanAdjuster implements ScheduledSlaPlanModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledSlaPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedScheduledSlaPlanAdjuster implements ScheduledSlaPlanModifier {
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

  adjust(item: ScheduledSlaPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ScheduledSlaPlanOpenRateOffsetAdjuster implements ScheduledSlaPlanModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: ScheduledSlaPlan, value: number): number {
    return value + item.openRate * this.weight;
  }
}

/** Runs the scheduled sla plan steps in order and keeps a trace of each. */
export class ScheduledSlaPlanEngine {
  steps: ScheduledSlaPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledSlaPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledSlaPlan): number {
    let current = item.netExposure();
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

  evaluateAll(items: ScheduledSlaPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledSlaPlanEngine(flagsValue: flags.Registry): ScheduledSlaPlanEngine {
  return new ScheduledSlaPlanEngine(
    [
      new PercentScheduledSlaPlanAdjuster(-9.4),
      new FlaggedScheduledSlaPlanAdjuster(flagsValue, "scheduled-sla-plan-tiered", -0.5),
      new ScheduledSlaPlanOpenRateOffsetAdjuster(1.14),
    ],
    [],
    0.2,
    1010.8,
  );
}
