import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackSlaTemplate } from "./fallback-sla-template.js";

/** One step of the fallback sla template calculation. */
export interface FallbackSlaTemplateModifier {
  describe(): string;
  adjust(item: FallbackSlaTemplate, value: number): number;
}

export class TieredFallbackSlaTemplateAdjuster implements FallbackSlaTemplateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackSlaTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFallbackSlaTemplateAdjuster implements FallbackSlaTemplateModifier {
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

  adjust(item: FallbackSlaTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackSlaTemplateAdjuster implements FallbackSlaTemplateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackSlaTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentFallbackSlaTemplateAdjuster implements FallbackSlaTemplateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackSlaTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FallbackSlaTemplateImpressionsOffsetAdjuster implements FallbackSlaTemplateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: FallbackSlaTemplate, value: number): number {
    return value + item.impressions * this.weight;
  }
}

/** Runs the fallback sla template steps in order and keeps a trace of each. */
export class FallbackSlaTemplateEngine {
  steps: FallbackSlaTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackSlaTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackSlaTemplate): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: FallbackSlaTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackSlaTemplateEngine(flagsValue: flags.Registry): FallbackSlaTemplateEngine {
  return new FallbackSlaTemplateEngine(
    [
      new TieredFallbackSlaTemplateAdjuster([2142, 4722, 5557, 8253], [1.03, 0.91, 1.2, 1.11]),
      new FlaggedFallbackSlaTemplateAdjuster(flagsValue, "fallback-sla-template-legacy", 9.9),
      new RoundingFallbackSlaTemplateAdjuster(0.1),
      new PercentFallbackSlaTemplateAdjuster(2.3),
      new FallbackSlaTemplateImpressionsOffsetAdjuster(1.57),
    ],
    [],
    4.7,
    57991.3,
  );
}
