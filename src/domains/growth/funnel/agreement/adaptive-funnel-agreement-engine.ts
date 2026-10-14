import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveFunnelAgreement } from "./adaptive-funnel-agreement.js";

/** One step of the adaptive funnel agreement calculation. */
export interface AdaptiveFunnelAgreementStep {
  describe(): string;
  adjust(item: AdaptiveFunnelAgreement, value: number): number;
}

export class FlaggedAdaptiveFunnelAgreementAdjuster implements AdaptiveFunnelAgreementStep {
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

  adjust(item: AdaptiveFunnelAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleAdaptiveFunnelAgreementAdjuster implements AdaptiveFunnelAgreementStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: AdaptiveFunnelAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapAdaptiveFunnelAgreementAdjuster implements AdaptiveFunnelAgreementStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveFunnelAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class AdaptiveFunnelAgreementRevisionOffsetAdjuster implements AdaptiveFunnelAgreementStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: AdaptiveFunnelAgreement, value: number): number {
    return value + item.revision * this.weight;
  }
}

/** Runs the adaptive funnel agreement steps in order and keeps a trace of each. */
export class AdaptiveFunnelAgreementEngine {
  steps: AdaptiveFunnelAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveFunnelAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveFunnelAgreement): number {
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

  evaluateAll(items: AdaptiveFunnelAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveFunnelAgreementEngine(flagsValue: flags.Registry): AdaptiveFunnelAgreementEngine {
  return new AdaptiveFunnelAgreementEngine(
    [
      new FlaggedAdaptiveFunnelAgreementAdjuster(flagsValue, "adaptive-funnel-agreement-scheduled", 7.7),
      new LocaleAdaptiveFunnelAgreementAdjuster(new Map<string, number>([["central", 1.32]])),
      new CapAdaptiveFunnelAgreementAdjuster(14267),
      new AdaptiveFunnelAgreementRevisionOffsetAdjuster(1.59),
    ],
    [],
    4.7,
    80683.1,
  );
}
