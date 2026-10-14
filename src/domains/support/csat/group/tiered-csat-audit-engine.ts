import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredCsatAudit } from "./tiered-csat-audit.js";

/** One step of the tiered csat audit calculation. */
export interface TieredCsatAuditModifier {
  describe(): string;
  adjust(item: TieredCsatAudit, value: number): number;
}

export class FlaggedTieredCsatAuditAdjuster implements TieredCsatAuditModifier {
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

  adjust(item: TieredCsatAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleTieredCsatAuditAdjuster implements TieredCsatAuditModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: TieredCsatAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredTieredCsatAuditAdjuster implements TieredCsatAuditModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredCsatAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered csat audit steps in order and keeps a trace of each. */
export class TieredCsatAuditEngine {
  steps: TieredCsatAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredCsatAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredCsatAudit): number {
    let current = item.netExposure();
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

  evaluateAll(items: TieredCsatAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredCsatAuditEngine(flagsValue: flags.Registry): TieredCsatAuditEngine {
  return new TieredCsatAuditEngine(
    [
      new FlaggedTieredCsatAuditAdjuster(flagsValue, "tiered-csat-audit-scheduled", 7.6),
      new TitleTieredCsatAuditAdjuster(
        new Map<string, number>([["west", 0.79], ["online", 1.31], ["east", 0.71]]),
      ),
      new TieredTieredCsatAuditAdjuster([51, 5968, 7280, 8351], [0.88, 0.82, 0.89, 1.19]),
    ],
    [],
    0.7,
    67778.2,
  );
}
