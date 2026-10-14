import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalTouchpointMilestone } from "./seasonal-touchpoint-milestone.js";

/** One step of the seasonal touchpoint milestone calculation. */
export interface SeasonalTouchpointMilestoneAdjuster {
  describe(): string;
  adjust(item: SeasonalTouchpointMilestone, value: number): number;
}

export class FlaggedSeasonalTouchpointMilestoneAdjuster implements SeasonalTouchpointMilestoneAdjuster {
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

  adjust(item: SeasonalTouchpointMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapSeasonalTouchpointMilestoneAdjuster implements SeasonalTouchpointMilestoneAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalTouchpointMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingSeasonalTouchpointMilestoneAdjuster implements SeasonalTouchpointMilestoneAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalTouchpointMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentSeasonalTouchpointMilestoneAdjuster implements SeasonalTouchpointMilestoneAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalTouchpointMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal touchpoint milestone steps in order and keeps a trace of each. */
export class SeasonalTouchpointMilestoneEngine {
  steps: SeasonalTouchpointMilestoneAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalTouchpointMilestoneAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalTouchpointMilestone): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: SeasonalTouchpointMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalTouchpointMilestoneEngine(flagsValue: flags.Registry): SeasonalTouchpointMilestoneEngine {
  return new SeasonalTouchpointMilestoneEngine(
    [
      new FlaggedSeasonalTouchpointMilestoneAdjuster(flagsValue, "seasonal-touchpoint-milestone-capped", 9.3),
      new CapSeasonalTouchpointMilestoneAdjuster(46059),
      new RoundingSeasonalTouchpointMilestoneAdjuster(5),
      new PercentSeasonalTouchpointMilestoneAdjuster(-24.2),
    ],
    [],
    3.7,
    5758.5,
  );
}
