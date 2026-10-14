import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SlaPlan } from "./sla-plan.js";

/** One step of the sla plan calculation. */
export interface SlaPlanFactor {
  describe(): string;
  adjust(item: SlaPlan, value: number): number;
}

export class CapSlaPlanAdjuster implements SlaPlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SlaPlanSequenceOffsetAdjuster implements SlaPlanFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: SlaPlan, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class FlaggedSlaPlanAdjuster implements SlaPlanFactor {
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

  adjust(item: SlaPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentSlaPlanAdjuster implements SlaPlanFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SlaPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSlaPlanAdjuster implements SlaPlanFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the sla plan steps in order and keeps a trace of each. */
export class SlaPlanEngine {
  steps: SlaPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SlaPlan): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: SlaPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSlaPlanEngine(flagsValue: flags.Registry): SlaPlanEngine {
  return new SlaPlanEngine(
    [
      new CapSlaPlanAdjuster(2044),
      new SlaPlanSequenceOffsetAdjuster(0.45),
      new FlaggedSlaPlanAdjuster(flagsValue, "sla-plan-pending", 7.5),
      new PercentSlaPlanAdjuster(3.4),
      new RoundingSlaPlanAdjuster(0.25),
    ],
    [],
    0.4,
    43409.6,
  );
}
