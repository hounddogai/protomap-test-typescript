import * as numbers from "../../../../kit/numbers.js";
import { ChallengeAudit } from "./challenge-audit.js";

/** One step of the challenge audit calculation. */
export interface ChallengeAuditFactor {
  describe(): string;
  adjust(item: ChallengeAudit, value: number): number;
}

export class ChallengeAuditRatioOffsetAdjuster implements ChallengeAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: ChallengeAudit, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class ChannelChallengeAuditAdjuster implements ChallengeAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ChallengeAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentChallengeAuditAdjuster implements ChallengeAuditFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ChallengeAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredChallengeAuditAdjuster implements ChallengeAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ChallengeAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the challenge audit steps in order and keeps a trace of each. */
export class ChallengeAuditEngine {
  steps: ChallengeAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ChallengeAudit): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ChallengeAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultChallengeAuditEngine(): ChallengeAuditEngine {
  return new ChallengeAuditEngine(
    [
      new ChallengeAuditRatioOffsetAdjuster(0.49),
      new ChannelChallengeAuditAdjuster(new Map<string, number>([["central", 0.98], ["north", 1.29]])),
      new PercentChallengeAuditAdjuster(16.6),
      new TieredChallengeAuditAdjuster([4347, 5799, 7442, 8152], [0.82, 0.83, 1.1, 0.84]),
    ],
    [],
    2.4,
    62587.4,
  );
}
