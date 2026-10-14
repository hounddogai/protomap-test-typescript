import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DomainClaim } from "./domain-claim.js";

/** One step of the domain claim calculation. */
export interface DomainClaimFactor {
  describe(): string;
  adjust(item: DomainClaim, value: number): number;
}

export class PercentDomainClaimAdjuster implements DomainClaimFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedDomainClaimAdjuster implements DomainClaimFactor {
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

  adjust(item: DomainClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapDomainClaimAdjuster implements DomainClaimFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DomainClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelDomainClaimAdjuster implements DomainClaimFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: DomainClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class DomainClaimThresholdOffsetAdjuster implements DomainClaimFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: DomainClaim, value: number): number {
    return value + item.threshold * this.weight;
  }
}

/** Runs the domain claim steps in order and keeps a trace of each. */
export class DomainClaimEngine {
  steps: DomainClaimFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainClaimFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DomainClaim): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: DomainClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDomainClaimEngine(flagsValue: flags.Registry): DomainClaimEngine {
  return new DomainClaimEngine(
    [
      new PercentDomainClaimAdjuster(-17.1),
      new FlaggedDomainClaimAdjuster(flagsValue, "domain-claim-scheduled", -8),
      new CapDomainClaimAdjuster(11233),
      new ChannelDomainClaimAdjuster(new Map<string, number>([["west", 0.75]])),
      new DomainClaimThresholdOffsetAdjuster(0.89),
    ],
    [],
    1.5,
    44991.1,
  );
}
