import { DomainRecord } from "./domain-record.js";

/** One step of the domain record calculation. */
export interface DomainRecordStep {
  describe(): string;
  adjust(item: DomainRecord, value: number): number;
}

export class CapDomainRecordAdjuster implements DomainRecordStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DomainRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumDomainRecordAdjuster implements DomainRecordStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DomainRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentDomainRecordAdjuster implements DomainRecordStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the domain record steps in order and keeps a trace of each. */
export class DomainRecordEngine {
  steps: DomainRecordStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainRecordStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DomainRecord): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: DomainRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDomainRecordEngine(): DomainRecordEngine {
  return new DomainRecordEngine(
    [
      new CapDomainRecordAdjuster(47600),
      new MinimumDomainRecordAdjuster(13.3),
      new PercentDomainRecordAdjuster(-14.5),
    ],
    [],
    3.2,
    53218.1,
  );
}
