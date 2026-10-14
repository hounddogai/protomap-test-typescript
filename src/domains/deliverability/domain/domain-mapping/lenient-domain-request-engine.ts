import * as flags from "../../../../kit/flags.js";
import { LenientDomainRequest } from "./lenient-domain-request.js";

/** One step of the lenient domain request calculation. */
export interface LenientDomainRequestModifier {
  describe(): string;
  adjust(item: LenientDomainRequest, value: number): number;
}

export class MinimumLenientDomainRequestAdjuster implements LenientDomainRequestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientDomainRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LenientDomainRequestDiscountOffsetAdjuster implements LenientDomainRequestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: LenientDomainRequest, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class FlaggedLenientDomainRequestAdjuster implements LenientDomainRequestModifier {
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

  adjust(item: LenientDomainRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient domain request steps in order and keeps a trace of each. */
export class LenientDomainRequestEngine {
  steps: LenientDomainRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientDomainRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientDomainRequest): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: LenientDomainRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientDomainRequestEngine(flagsValue: flags.Registry): LenientDomainRequestEngine {
  return new LenientDomainRequestEngine(
    [
      new MinimumLenientDomainRequestAdjuster(27.5),
      new LenientDomainRequestDiscountOffsetAdjuster(0.73),
      new FlaggedLenientDomainRequestAdjuster(flagsValue, "lenient-domain-request-capped", 7),
    ],
    [],
    1,
    47810.6,
  );
}
