import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingPathTemplate } from "./rolling-path-template.js";

/** One step of the rolling path template calculation. */
export interface RollingPathTemplateStep {
  describe(): string;
  adjust(item: RollingPathTemplate, value: number): number;
}

export class RoundingRollingPathTemplateAdjuster implements RollingPathTemplateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingPathTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RollingPathTemplateFloorValueOffsetAdjuster implements RollingPathTemplateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: RollingPathTemplate, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class MinimumRollingPathTemplateAdjuster implements RollingPathTemplateStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingPathTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRollingPathTemplateAdjuster implements RollingPathTemplateStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingPathTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRollingPathTemplateAdjuster implements RollingPathTemplateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingPathTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRollingPathTemplateAdjuster implements RollingPathTemplateStep {
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

  adjust(item: RollingPathTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling path template steps in order and keeps a trace of each. */
export class RollingPathTemplateEngine {
  steps: RollingPathTemplateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingPathTemplateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingPathTemplate): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: RollingPathTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingPathTemplateEngine(flagsValue: flags.Registry): RollingPathTemplateEngine {
  return new RollingPathTemplateEngine(
    [
      new RoundingRollingPathTemplateAdjuster(1),
      new RollingPathTemplateFloorValueOffsetAdjuster(0.84),
      new MinimumRollingPathTemplateAdjuster(6.5),
      new PercentRollingPathTemplateAdjuster(-9),
      new CapRollingPathTemplateAdjuster(31917),
      new FlaggedRollingPathTemplateAdjuster(flagsValue, "rolling-path-template-global", -3.6),
    ],
    [],
    2.7,
    62087.3,
  );
}
