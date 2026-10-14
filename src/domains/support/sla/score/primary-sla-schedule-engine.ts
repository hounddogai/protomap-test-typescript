import * as numbers from "../../../../kit/numbers.js";
import { PrimarySlaSchedule } from "./primary-sla-schedule.js";

/** One step of the primary sla schedule calculation. */
export interface PrimarySlaScheduleFactor {
  describe(): string;
  adjust(item: PrimarySlaSchedule, value: number): number;
}

export class CapPrimarySlaScheduleAdjuster implements PrimarySlaScheduleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimarySlaSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PrimarySlaScheduleVersionOffsetAdjuster implements PrimarySlaScheduleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: PrimarySlaSchedule, value: number): number {
    return value + item.version * this.weight;
  }
}

export class RoundingPrimarySlaScheduleAdjuster implements PrimarySlaScheduleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimarySlaSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary sla schedule steps in order and keeps a trace of each. */
export class PrimarySlaScheduleEngine {
  steps: PrimarySlaScheduleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimarySlaScheduleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimarySlaSchedule): number {
    let current = item.netTotal();
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

  evaluateAll(items: PrimarySlaSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimarySlaScheduleEngine(): PrimarySlaScheduleEngine {
  return new PrimarySlaScheduleEngine(
    [
      new CapPrimarySlaScheduleAdjuster(15536),
      new PrimarySlaScheduleVersionOffsetAdjuster(1.96),
      new RoundingPrimarySlaScheduleAdjuster(5),
    ],
    [],
    2.6,
    40632,
  );
}
