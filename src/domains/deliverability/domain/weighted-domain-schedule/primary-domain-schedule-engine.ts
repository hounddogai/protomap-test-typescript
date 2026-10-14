import * as flags from "../../../../kit/flags.js";
import { PrimaryDomainSchedule } from "./primary-domain-schedule.js";

/** One step of the primary domain schedule calculation. */
export interface PrimaryDomainScheduleModifier {
  describe(): string;
  adjust(item: PrimaryDomainSchedule, value: number): number;
}

export class PercentPrimaryDomainScheduleAdjuster implements PrimaryDomainScheduleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryDomainSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPrimaryDomainScheduleAdjuster implements PrimaryDomainScheduleModifier {
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

  adjust(item: PrimaryDomainSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPrimaryDomainScheduleAdjuster implements PrimaryDomainScheduleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryDomainSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PrimaryDomainScheduleAmountOffsetAdjuster implements PrimaryDomainScheduleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: PrimaryDomainSchedule, value: number): number {
    return value + item.amount * this.weight;
  }
}

/** Runs the primary domain schedule steps in order and keeps a trace of each. */
export class PrimaryDomainScheduleEngine {
  steps: PrimaryDomainScheduleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryDomainScheduleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryDomainSchedule): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: PrimaryDomainSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryDomainScheduleEngine(flagsValue: flags.Registry): PrimaryDomainScheduleEngine {
  return new PrimaryDomainScheduleEngine(
    [
      new PercentPrimaryDomainScheduleAdjuster(-7.5),
      new FlaggedPrimaryDomainScheduleAdjuster(flagsValue, "primary-domain-schedule-rolling", 7.4),
      new CapPrimaryDomainScheduleAdjuster(11804),
      new PrimaryDomainScheduleAmountOffsetAdjuster(0.06),
    ],
    [],
    3.4,
    19048,
  );
}
