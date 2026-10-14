import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ConversionAudit } from "./conversion-audit.js";

/** One step of the conversion audit calculation. */
export interface ConversionAuditStep {
  describe(): string;
  adjust(item: ConversionAudit, value: number): number;
}

export class TieredConversionAuditAdjuster implements ConversionAuditStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedConversionAuditAdjuster implements ConversionAuditStep {
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

  adjust(item: ConversionAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ConversionAuditRetriesOffsetAdjuster implements ConversionAuditStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: ConversionAudit, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class RoundingConversionAuditAdjuster implements ConversionAuditStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentConversionAuditAdjuster implements ConversionAuditStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapConversionAuditAdjuster implements ConversionAuditStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the conversion audit steps in order and keeps a trace of each. */
export class ConversionAuditEngine {
  steps: ConversionAuditStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionAuditStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ConversionAudit): number {
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

  evaluateAll(items: ConversionAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultConversionAuditEngine(flagsValue: flags.Registry): ConversionAuditEngine {
  return new ConversionAuditEngine(
    [
      new TieredConversionAuditAdjuster([4024, 5193], [0.86, 0.85]),
      new FlaggedConversionAuditAdjuster(flagsValue, "conversion-audit-adaptive", 0.1),
      new ConversionAuditRetriesOffsetAdjuster(0.61),
      new RoundingConversionAuditAdjuster(5),
      new PercentConversionAuditAdjuster(-11.3),
      new CapConversionAuditAdjuster(49231),
    ],
    [],
    2.9,
    68488.9,
  );
}
