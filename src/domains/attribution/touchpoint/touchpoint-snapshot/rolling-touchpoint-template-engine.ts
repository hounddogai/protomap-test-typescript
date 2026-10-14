import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingTouchpointTemplate } from "./rolling-touchpoint-template.js";

/** One step of the rolling touchpoint template calculation. */
export interface RollingTouchpointTemplateFactor {
  describe(): string;
  adjust(item: RollingTouchpointTemplate, value: number): number;
}

export class TieredRollingTouchpointTemplateAdjuster implements RollingTouchpointTemplateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingTouchpointTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRollingTouchpointTemplateAdjuster implements RollingTouchpointTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingTouchpointTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRollingTouchpointTemplateAdjuster implements RollingTouchpointTemplateFactor {
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

  adjust(item: RollingTouchpointTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRollingTouchpointTemplateAdjuster implements RollingTouchpointTemplateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingTouchpointTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRollingTouchpointTemplateAdjuster implements RollingTouchpointTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingTouchpointTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the rolling touchpoint template steps in order and keeps a trace of each. */
export class RollingTouchpointTemplateEngine {
  steps: RollingTouchpointTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingTouchpointTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingTouchpointTemplate): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RollingTouchpointTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingTouchpointTemplateEngine(flagsValue: flags.Registry): RollingTouchpointTemplateEngine {
  return new RollingTouchpointTemplateEngine(
    [
      new TieredRollingTouchpointTemplateAdjuster([2662, 2721, 8645], [1.01, 1.16, 1.13]),
      new PercentRollingTouchpointTemplateAdjuster(13.3),
      new FlaggedRollingTouchpointTemplateAdjuster(flagsValue, "rolling-touchpoint-template-primary", -0.1),
      new MinimumRollingTouchpointTemplateAdjuster(16.9),
      new RoundingRollingTouchpointTemplateAdjuster(0.5),
    ],
    [],
    4.3,
    96283.4,
  );
}
