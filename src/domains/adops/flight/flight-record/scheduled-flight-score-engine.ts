import * as flags from "../../../../kit/flags.js";
import { ScheduledFlightScore } from "./scheduled-flight-score.js";

/** One step of the scheduled flight score calculation. */
export interface ScheduledFlightScoreAdjuster {
  describe(): string;
  adjust(item: ScheduledFlightScore, value: number): number;
}

export class CapScheduledFlightScoreAdjuster implements ScheduledFlightScoreAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledFlightScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedScheduledFlightScoreAdjuster implements ScheduledFlightScoreAdjuster {
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

  adjust(item: ScheduledFlightScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ScheduledFlightScoreFloorValueOffsetAdjuster implements ScheduledFlightScoreAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: ScheduledFlightScore, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

/** Runs the scheduled flight score steps in order and keeps a trace of each. */
export class ScheduledFlightScoreEngine {
  steps: ScheduledFlightScoreAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledFlightScoreAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledFlightScore): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ScheduledFlightScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledFlightScoreEngine(flagsValue: flags.Registry): ScheduledFlightScoreEngine {
  return new ScheduledFlightScoreEngine(
    [
      new CapScheduledFlightScoreAdjuster(41493),
      new FlaggedScheduledFlightScoreAdjuster(flagsValue, "scheduled-flight-score-global", 5.1),
      new ScheduledFlightScoreFloorValueOffsetAdjuster(0.42),
    ],
    [],
    1.8,
    69982.2,
  );
}
