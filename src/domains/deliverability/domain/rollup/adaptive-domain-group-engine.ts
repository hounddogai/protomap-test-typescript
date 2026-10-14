import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveDomainGroup } from "./adaptive-domain-group.js";

/** One step of the adaptive domain group calculation. */
export interface AdaptiveDomainGroupAdjuster {
  describe(): string;
  adjust(item: AdaptiveDomainGroup, value: number): number;
}

export class PercentAdaptiveDomainGroupAdjuster implements AdaptiveDomainGroupAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveDomainGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveDomainGroupAdjuster implements AdaptiveDomainGroupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveDomainGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleAdaptiveDomainGroupAdjuster implements AdaptiveDomainGroupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: AdaptiveDomainGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the adaptive domain group steps in order and keeps a trace of each. */
export class AdaptiveDomainGroupEngine {
  steps: AdaptiveDomainGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveDomainGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveDomainGroup): number {
    let current = item.netExposure();
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

  evaluateAll(items: AdaptiveDomainGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveDomainGroupEngine(): AdaptiveDomainGroupEngine {
  return new AdaptiveDomainGroupEngine(
    [
      new PercentAdaptiveDomainGroupAdjuster(-16.9),
      new RoundingAdaptiveDomainGroupAdjuster(0.05),
      new TitleAdaptiveDomainGroupAdjuster(new Map<string, number>([["central", 1.04]])),
    ],
    [],
    1.5,
    14722.6,
  );
}
