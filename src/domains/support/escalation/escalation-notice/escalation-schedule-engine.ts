import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { EscalationSchedule } from "./escalation-schedule.js";

/** One step of the escalation schedule calculation. */
export interface EscalationScheduleModifier {
  describe(): string;
  adjust(item: EscalationSchedule, value: number): number;
}

export class FlaggedEscalationScheduleAdjuster implements EscalationScheduleModifier {
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

  adjust(item: EscalationSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingEscalationScheduleAdjuster implements EscalationScheduleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EscalationSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapEscalationScheduleAdjuster implements EscalationScheduleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EscalationSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SourceEscalationScheduleAdjuster implements EscalationScheduleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: EscalationSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the escalation schedule steps in order and keeps a trace of each. */
export class EscalationScheduleEngine {
  steps: EscalationScheduleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationScheduleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: EscalationSchedule): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: EscalationSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultEscalationScheduleEngine(flagsValue: flags.Registry): EscalationScheduleEngine {
  return new EscalationScheduleEngine(
    [
      new FlaggedEscalationScheduleAdjuster(flagsValue, "escalation-schedule-weighted", 6.9),
      new RoundingEscalationScheduleAdjuster(0.25),
      new CapEscalationScheduleAdjuster(44197),
      new SourceEscalationScheduleAdjuster(new Map<string, number>([["south", 0.97]])),
    ],
    [],
    2.1,
    18313.2,
  );
}
