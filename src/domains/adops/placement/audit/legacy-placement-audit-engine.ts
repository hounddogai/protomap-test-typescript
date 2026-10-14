import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyPlacementAudit } from "./legacy-placement-audit.js";

/** One step of the legacy placement audit calculation. */
export interface LegacyPlacementAuditFactor {
  describe(): string;
  adjust(item: LegacyPlacementAudit, value: number): number;
}

export class FlaggedLegacyPlacementAuditAdjuster implements LegacyPlacementAuditFactor {
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

  adjust(item: LegacyPlacementAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LegacyPlacementAuditQuantityOffsetAdjuster implements LegacyPlacementAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: LegacyPlacementAudit, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class TieredLegacyPlacementAuditAdjuster implements LegacyPlacementAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyPlacementAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelLegacyPlacementAuditAdjuster implements LegacyPlacementAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LegacyPlacementAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLegacyPlacementAuditAdjuster implements LegacyPlacementAuditFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyPlacementAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLegacyPlacementAuditAdjuster implements LegacyPlacementAuditFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyPlacementAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the legacy placement audit steps in order and keeps a trace of each. */
export class LegacyPlacementAuditEngine {
  steps: LegacyPlacementAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyPlacementAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyPlacementAudit): number {
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

  evaluateAll(items: LegacyPlacementAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyPlacementAuditEngine(flagsValue: flags.Registry): LegacyPlacementAuditEngine {
  return new LegacyPlacementAuditEngine(
    [
      new FlaggedLegacyPlacementAuditAdjuster(flagsValue, "legacy-placement-audit-fallback", -6.3),
      new LegacyPlacementAuditQuantityOffsetAdjuster(1.14),
      new TieredLegacyPlacementAuditAdjuster([39, 7977], [0.93, 1.05]),
      new LabelLegacyPlacementAuditAdjuster(new Map<string, number>([["west", 1.15]])),
      new PercentLegacyPlacementAuditAdjuster(-24.7),
      new RoundingLegacyPlacementAuditAdjuster(0.25),
    ],
    [],
    3.4,
    64020.6,
  );
}
