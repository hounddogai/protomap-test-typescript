import { DomainTemplate } from "./domain-template.js";

/** One step of the domain template calculation. */
export interface DomainTemplateStep {
  describe(): string;
  adjust(item: DomainTemplate, value: number): number;
}

export class TieredDomainTemplateAdjuster implements DomainTemplateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DomainTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class DomainTemplateOpenRateOffsetAdjuster implements DomainTemplateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: DomainTemplate, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class PercentDomainTemplateAdjuster implements DomainTemplateStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the domain template steps in order and keeps a trace of each. */
export class DomainTemplateEngine {
  steps: DomainTemplateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainTemplateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DomainTemplate): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: DomainTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDomainTemplateEngine(): DomainTemplateEngine {
  return new DomainTemplateEngine(
    [
      new TieredDomainTemplateAdjuster([3264, 5745, 7456], [1, 1.16, 1.09]),
      new DomainTemplateOpenRateOffsetAdjuster(1.75),
      new PercentDomainTemplateAdjuster(-8.3),
    ],
    [],
    3,
    41122.3,
  );
}
