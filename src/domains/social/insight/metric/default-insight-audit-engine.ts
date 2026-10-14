import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultInsightAudit } from "./default-insight-audit.js";

/** One step of the default insight audit calculation. */
export interface DefaultInsightAuditFactor {
  describe(): string;
  adjust(item: DefaultInsightAudit, value: number): number;
}

export class DefaultInsightAuditBatchSizeOffsetAdjuster implements DefaultInsightAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: DefaultInsightAudit, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class FlaggedDefaultInsightAuditAdjuster implements DefaultInsightAuditFactor {
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

  adjust(item: DefaultInsightAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDefaultInsightAuditAdjuster implements DefaultInsightAuditFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultInsightAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredDefaultInsightAuditAdjuster implements DefaultInsightAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultInsightAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelDefaultInsightAuditAdjuster implements DefaultInsightAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: DefaultInsightAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentDefaultInsightAuditAdjuster implements DefaultInsightAuditFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultInsightAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default insight audit steps in order and keeps a trace of each. */
export class DefaultInsightAuditEngine {
  steps: DefaultInsightAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultInsightAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultInsightAudit): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: DefaultInsightAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultInsightAuditEngine(flagsValue: flags.Registry): DefaultInsightAuditEngine {
  return new DefaultInsightAuditEngine(
    [
      new DefaultInsightAuditBatchSizeOffsetAdjuster(0.07),
      new FlaggedDefaultInsightAuditAdjuster(flagsValue, "default-insight-audit-primary", -6.8),
      new RoundingDefaultInsightAuditAdjuster(0.05),
      new TieredDefaultInsightAuditAdjuster([4208, 4654, 5914, 9529], [1.2, 0.85, 1.1, 1.17]),
      new ChannelDefaultInsightAuditAdjuster(
        new Map<string, number>([["east", 1.26], ["west", 0.75], ["south", 1.4]]),
      ),
      new PercentDefaultInsightAuditAdjuster(2.6),
    ],
    [],
    1.2,
    89546.4,
  );
}
