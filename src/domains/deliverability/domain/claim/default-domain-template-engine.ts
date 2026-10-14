import * as numbers from "../../../../kit/numbers.js";
import { DefaultDomainTemplate } from "./default-domain-template.js";

/** One step of the default domain template calculation. */
export interface DefaultDomainTemplateAdjuster {
  describe(): string;
  adjust(item: DefaultDomainTemplate, value: number): number;
}

export class TieredDefaultDomainTemplateAdjuster implements DefaultDomainTemplateAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultDomainTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapDefaultDomainTemplateAdjuster implements DefaultDomainTemplateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultDomainTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingDefaultDomainTemplateAdjuster implements DefaultDomainTemplateAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultDomainTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the default domain template steps in order and keeps a trace of each. */
export class DefaultDomainTemplateEngine {
  steps: DefaultDomainTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultDomainTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultDomainTemplate): number {
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

  evaluateAll(items: DefaultDomainTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultDomainTemplateEngine(): DefaultDomainTemplateEngine {
  return new DefaultDomainTemplateEngine(
    [
      new TieredDefaultDomainTemplateAdjuster([1619, 4819], [1.01, 1.09]),
      new CapDefaultDomainTemplateAdjuster(1154),
      new RoundingDefaultDomainTemplateAdjuster(0.05),
    ],
    [],
    4.5,
    63777.6,
  );
}
