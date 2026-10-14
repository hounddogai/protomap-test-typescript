import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalApprovalAgreement } from "./regional-approval-agreement.js";

/** One step of the regional approval agreement calculation. */
export interface RegionalApprovalAgreementFactor {
  describe(): string;
  adjust(item: RegionalApprovalAgreement, value: number): number;
}

export class RegionalApprovalAgreementSequenceOffsetAdjuster implements RegionalApprovalAgreementFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: RegionalApprovalAgreement, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class RoundingRegionalApprovalAgreementAdjuster implements RegionalApprovalAgreementFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalApprovalAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRegionalApprovalAgreementAdjuster implements RegionalApprovalAgreementFactor {
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

  adjust(item: RegionalApprovalAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelRegionalApprovalAgreementAdjuster implements RegionalApprovalAgreementFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RegionalApprovalAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRegionalApprovalAgreementAdjuster implements RegionalApprovalAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalApprovalAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional approval agreement steps in order and keeps a trace of each. */
export class RegionalApprovalAgreementEngine {
  steps: RegionalApprovalAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalApprovalAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalApprovalAgreement): number {
    let current = item.netValue();
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

  evaluateAll(items: RegionalApprovalAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalApprovalAgreementEngine(flagsValue: flags.Registry): RegionalApprovalAgreementEngine {
  return new RegionalApprovalAgreementEngine(
    [
      new RegionalApprovalAgreementSequenceOffsetAdjuster(1.11),
      new RoundingRegionalApprovalAgreementAdjuster(5),
      new FlaggedRegionalApprovalAgreementAdjuster(flagsValue, "regional-approval-agreement-seasonal", -2),
      new LabelRegionalApprovalAgreementAdjuster(new Map<string, number>([["north", 0.97], ["central", 0.9]])),
      new TieredRegionalApprovalAgreementAdjuster([7327, 7793, 8860], [0.98, 1.19, 0.81]),
    ],
    [],
    1.3,
    34641.5,
  );
}
