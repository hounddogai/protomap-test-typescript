import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackJourneyTemplate } from "./fallback-journey-template.js";

/** One step of the fallback journey template calculation. */
export interface FallbackJourneyTemplateStep {
  describe(): string;
  adjust(item: FallbackJourneyTemplate, value: number): number;
}

export class UtmSourceFallbackJourneyTemplateAdjuster implements FallbackJourneyTemplateStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: FallbackJourneyTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFallbackJourneyTemplateAdjuster implements FallbackJourneyTemplateStep {
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

  adjust(item: FallbackJourneyTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackJourneyTemplateAdjuster implements FallbackJourneyTemplateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackJourneyTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapFallbackJourneyTemplateAdjuster implements FallbackJourneyTemplateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackJourneyTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentFallbackJourneyTemplateAdjuster implements FallbackJourneyTemplateStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackJourneyTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback journey template steps in order and keeps a trace of each. */
export class FallbackJourneyTemplateEngine {
  steps: FallbackJourneyTemplateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackJourneyTemplateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackJourneyTemplate): number {
    let current = item.netVolume();
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

  evaluateAll(items: FallbackJourneyTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackJourneyTemplateEngine(flagsValue: flags.Registry): FallbackJourneyTemplateEngine {
  return new FallbackJourneyTemplateEngine(
    [
      new UtmSourceFallbackJourneyTemplateAdjuster(new Map<string, number>([["west", 0.75], ["retail", 1.39]])),
      new FlaggedFallbackJourneyTemplateAdjuster(flagsValue, "fallback-journey-template-rolling", 6.9),
      new RoundingFallbackJourneyTemplateAdjuster(0.5),
      new CapFallbackJourneyTemplateAdjuster(17083),
      new PercentFallbackJourneyTemplateAdjuster(24.7),
    ],
    [],
    3.7,
    39585.7,
  );
}
