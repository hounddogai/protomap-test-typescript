import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingEnrollmentWindow } from "./rolling-enrollment-window.js";

/** One step of the rolling enrollment window calculation. */
export interface RollingEnrollmentWindowAdjuster {
  describe(): string;
  adjust(item: RollingEnrollmentWindow, value: number): number;
}

export class FlaggedRollingEnrollmentWindowAdjuster implements RollingEnrollmentWindowAdjuster {
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

  adjust(item: RollingEnrollmentWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRollingEnrollmentWindowAdjuster implements RollingEnrollmentWindowAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingEnrollmentWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RollingEnrollmentWindowImpressionsOffsetAdjuster implements RollingEnrollmentWindowAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: RollingEnrollmentWindow, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class PercentRollingEnrollmentWindowAdjuster implements RollingEnrollmentWindowAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingEnrollmentWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingEnrollmentWindowAdjuster implements RollingEnrollmentWindowAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingEnrollmentWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the rolling enrollment window steps in order and keeps a trace of each. */
export class RollingEnrollmentWindowEngine {
  steps: RollingEnrollmentWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingEnrollmentWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingEnrollmentWindow): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: RollingEnrollmentWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingEnrollmentWindowEngine(flagsValue: flags.Registry): RollingEnrollmentWindowEngine {
  return new RollingEnrollmentWindowEngine(
    [
      new FlaggedRollingEnrollmentWindowAdjuster(flagsValue, "rolling-enrollment-window-tiered", 3.4),
      new CapRollingEnrollmentWindowAdjuster(38419),
      new RollingEnrollmentWindowImpressionsOffsetAdjuster(0.9),
      new PercentRollingEnrollmentWindowAdjuster(6.2),
      new RoundingRollingEnrollmentWindowAdjuster(0.05),
    ],
    [],
    4,
    36517.3,
  );
}
