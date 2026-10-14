import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { OptOutAudit } from "./opt-out-audit.js";

/** One step of the opt out audit calculation. */
export interface OptOutAuditFactor {
  describe(): string;
  adjust(item: OptOutAudit, value: number): number;
}

export class MinimumOptOutAuditAdjuster implements OptOutAuditFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: OptOutAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingOptOutAuditAdjuster implements OptOutAuditFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedOptOutAuditAdjuster implements OptOutAuditFactor {
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

  adjust(item: OptOutAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredOptOutAuditAdjuster implements OptOutAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleOptOutAuditAdjuster implements OptOutAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: OptOutAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the opt out audit steps in order and keeps a trace of each. */
export class OptOutAuditEngine {
  steps: OptOutAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: OptOutAudit): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: OptOutAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultOptOutAuditEngine(flagsValue: flags.Registry): OptOutAuditEngine {
  return new OptOutAuditEngine(
    [
      new MinimumOptOutAuditAdjuster(17.4),
      new RoundingOptOutAuditAdjuster(5),
      new FlaggedOptOutAuditAdjuster(flagsValue, "opt-out-audit-scheduled", -4.8),
      new TieredOptOutAuditAdjuster([1942, 4746, 6314], [1, 0.9, 0.98]),
      new TitleOptOutAuditAdjuster(
        new Map<string, number>([["south", 0.81], ["retail", 1.27], ["online", 0.9]]),
      ),
    ],
    [],
    4.9,
    16196.2,
  );
}
