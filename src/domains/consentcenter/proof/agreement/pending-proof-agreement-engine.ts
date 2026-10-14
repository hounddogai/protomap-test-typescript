import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingProofAgreement } from "./pending-proof-agreement.js";

/** One step of the pending proof agreement calculation. */
export interface PendingProofAgreementModifier {
  describe(): string;
  adjust(item: PendingProofAgreement, value: number): number;
}

export class RoundingPendingProofAgreementAdjuster implements PendingProofAgreementModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingProofAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPendingProofAgreementAdjuster implements PendingProofAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingProofAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NamePendingProofAgreementAdjuster implements PendingProofAgreementModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PendingProofAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPendingProofAgreementAdjuster implements PendingProofAgreementModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingProofAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPendingProofAgreementAdjuster implements PendingProofAgreementModifier {
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

  adjust(item: PendingProofAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PendingProofAgreementAmountOffsetAdjuster implements PendingProofAgreementModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: PendingProofAgreement, value: number): number {
    return value + item.amount * this.weight;
  }
}

/** Runs the pending proof agreement steps in order and keeps a trace of each. */
export class PendingProofAgreementEngine {
  steps: PendingProofAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingProofAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingProofAgreement): number {
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

  evaluateAll(items: PendingProofAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingProofAgreementEngine(flagsValue: flags.Registry): PendingProofAgreementEngine {
  return new PendingProofAgreementEngine(
    [
      new RoundingPendingProofAgreementAdjuster(5),
      new CapPendingProofAgreementAdjuster(15819),
      new NamePendingProofAgreementAdjuster(new Map<string, number>([["west", 0.77], ["online", 0.99]])),
      new PercentPendingProofAgreementAdjuster(-6.8),
      new FlaggedPendingProofAgreementAdjuster(flagsValue, "pending-proof-agreement-rolling", 8.3),
      new PendingProofAgreementAmountOffsetAdjuster(0.45),
    ],
    [],
    3.9,
    58733.2,
  );
}
