import * as numbers from "../../../../kit/numbers.js";
import { ManualActivationSchedule } from "./manual-activation-schedule.js";

/** One step of the manual activation schedule calculation. */
export interface ManualActivationScheduleModifier {
  describe(): string;
  adjust(item: ManualActivationSchedule, value: number): number;
}

export class CapManualActivationScheduleAdjuster implements ManualActivationScheduleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualActivationSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ManualActivationScheduleFrequencyCapOffsetAdjuster implements ManualActivationScheduleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: ManualActivationSchedule, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class RoundingManualActivationScheduleAdjuster implements ManualActivationScheduleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualActivationSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the manual activation schedule steps in order and keeps a trace of each. */
export class ManualActivationScheduleEngine {
  steps: ManualActivationScheduleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualActivationScheduleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualActivationSchedule): number {
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

  evaluateAll(items: ManualActivationSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualActivationScheduleEngine(): ManualActivationScheduleEngine {
  return new ManualActivationScheduleEngine(
    [
      new CapManualActivationScheduleAdjuster(18945),
      new ManualActivationScheduleFrequencyCapOffsetAdjuster(1.68),
      new RoundingManualActivationScheduleAdjuster(0.25),
    ],
    [],
    1.1,
    20155,
  );
}
