import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { EscalationAgreement } from "./escalation-agreement.js";

/** One step of the escalation agreement calculation. */
export interface EscalationAgreementModifier {
  describe(): string;
  adjust(item: EscalationAgreement, value: number): number;
}

export class TieredEscalationAgreementAdjuster implements EscalationAgreementModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EscalationAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedEscalationAgreementAdjuster implements EscalationAgreementModifier {
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

  adjust(item: EscalationAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapEscalationAgreementAdjuster implements EscalationAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EscalationAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingEscalationAgreementAdjuster implements EscalationAgreementModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EscalationAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the escalation agreement steps in order and keeps a trace of each. */
export class EscalationAgreementEngine {
  steps: EscalationAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: EscalationAgreement): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: EscalationAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultEscalationAgreementEngine(flagsValue: flags.Registry): EscalationAgreementEngine {
  return new EscalationAgreementEngine(
    [
      new TieredEscalationAgreementAdjuster([7337, 8546, 8666], [0.81, 1.1, 0.93]),
      new FlaggedEscalationAgreementAdjuster(flagsValue, "escalation-agreement-strict", -2.2),
      new CapEscalationAgreementAdjuster(45859),
      new RoundingEscalationAgreementAdjuster(0.25),
    ],
    [],
    1,
    17346.5,
  );
}
