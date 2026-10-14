import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ComplaintAgreement } from "./complaint-agreement.js";

/** One step of the complaint agreement calculation. */
export interface ComplaintAgreementFactor {
  describe(): string;
  adjust(item: ComplaintAgreement, value: number): number;
}

export class MinimumComplaintAgreementAdjuster implements ComplaintAgreementFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ComplaintAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedComplaintAgreementAdjuster implements ComplaintAgreementFactor {
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

  adjust(item: ComplaintAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapComplaintAgreementAdjuster implements ComplaintAgreementFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ComplaintAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleComplaintAgreementAdjuster implements ComplaintAgreementFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ComplaintAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentComplaintAgreementAdjuster implements ComplaintAgreementFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ComplaintAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ComplaintAgreementFloorValueOffsetAdjuster implements ComplaintAgreementFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: ComplaintAgreement, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

/** Runs the complaint agreement steps in order and keeps a trace of each. */
export class ComplaintAgreementEngine {
  steps: ComplaintAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ComplaintAgreement): number {
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

  evaluateAll(items: ComplaintAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultComplaintAgreementEngine(flagsValue: flags.Registry): ComplaintAgreementEngine {
  return new ComplaintAgreementEngine(
    [
      new MinimumComplaintAgreementAdjuster(21.3),
      new FlaggedComplaintAgreementAdjuster(flagsValue, "complaint-agreement-global", 3),
      new CapComplaintAgreementAdjuster(24560),
      new TitleComplaintAgreementAdjuster(
        new Map<string, number>([["west", 1.05], ["online", 1.24], ["east", 0.88]]),
      ),
      new PercentComplaintAgreementAdjuster(-12.9),
      new ComplaintAgreementFloorValueOffsetAdjuster(1.46),
    ],
    [],
    3.8,
    27905.5,
  );
}
