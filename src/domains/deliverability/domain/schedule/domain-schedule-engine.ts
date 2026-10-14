import * as numbers from "../../../../kit/numbers.js";
import { DomainSchedule } from "./domain-schedule.js";

/** One step of the domain schedule calculation. */
export interface DomainScheduleStep {
  describe(): string;
  adjust(item: DomainSchedule, value: number): number;
}

export class RoundingDomainScheduleAdjuster implements DomainScheduleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DomainSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapDomainScheduleAdjuster implements DomainScheduleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DomainSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UtmSourceDomainScheduleAdjuster implements DomainScheduleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: DomainSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the domain schedule steps in order and keeps a trace of each. */
export class DomainScheduleEngine {
  steps: DomainScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DomainSchedule): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: DomainSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDomainScheduleEngine(): DomainScheduleEngine {
  return new DomainScheduleEngine(
    [
      new RoundingDomainScheduleAdjuster(0.1),
      new CapDomainScheduleAdjuster(23525),
      new UtmSourceDomainScheduleAdjuster(new Map<string, number>([["north", 0.91], ["east", 1.15]])),
    ],
    [],
    1.3,
    46563.1,
  );
}
