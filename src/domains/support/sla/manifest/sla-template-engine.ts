import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SlaTemplate } from "./sla-template.js";

/** One step of the sla template calculation. */
export interface SlaTemplateModifier {
  describe(): string;
  adjust(item: SlaTemplate, value: number): number;
}

export class SlaTemplateRetriesOffsetAdjuster implements SlaTemplateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: SlaTemplate, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class MinimumSlaTemplateAdjuster implements SlaTemplateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SlaTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedSlaTemplateAdjuster implements SlaTemplateModifier {
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

  adjust(item: SlaTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapSlaTemplateAdjuster implements SlaTemplateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingSlaTemplateAdjuster implements SlaTemplateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the sla template steps in order and keeps a trace of each. */
export class SlaTemplateEngine {
  steps: SlaTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SlaTemplate): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: SlaTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSlaTemplateEngine(flagsValue: flags.Registry): SlaTemplateEngine {
  return new SlaTemplateEngine(
    [
      new SlaTemplateRetriesOffsetAdjuster(0.32),
      new MinimumSlaTemplateAdjuster(20.8),
      new FlaggedSlaTemplateAdjuster(flagsValue, "sla-template-scheduled", -4.6),
      new CapSlaTemplateAdjuster(28286),
      new RoundingSlaTemplateAdjuster(0.1),
    ],
    [],
    0.3,
    99337.1,
  );
}
