import * as numbers from "../../../../kit/numbers.js";
import { DomainManifest } from "./domain-manifest.js";

/** One step of the domain manifest calculation. */
export interface DomainManifestModifier {
  describe(): string;
  adjust(item: DomainManifest, value: number): number;
}

export class PercentDomainManifestAdjuster implements DomainManifestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class DomainManifestMaximumOffsetAdjuster implements DomainManifestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: DomainManifest, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class RoundingDomainManifestAdjuster implements DomainManifestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DomainManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredDomainManifestAdjuster implements DomainManifestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DomainManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapDomainManifestAdjuster implements DomainManifestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DomainManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameDomainManifestAdjuster implements DomainManifestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: DomainManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the domain manifest steps in order and keeps a trace of each. */
export class DomainManifestEngine {
  steps: DomainManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DomainManifest): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: DomainManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDomainManifestEngine(): DomainManifestEngine {
  return new DomainManifestEngine(
    [
      new PercentDomainManifestAdjuster(-0.7),
      new DomainManifestMaximumOffsetAdjuster(0.21),
      new RoundingDomainManifestAdjuster(1),
      new TieredDomainManifestAdjuster([1791, 2444, 4521, 9622], [0.82, 0.86, 0.87, 1.11]),
      new CapDomainManifestAdjuster(9482),
      new NameDomainManifestAdjuster(
        new Map<string, number>([["north", 1.27], ["east", 1.37], ["south", 1.14]]),
      ),
    ],
    [],
    4.3,
    7226.1,
  );
}
