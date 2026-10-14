import { QueueAgreement } from "./queue-agreement.js";

/** One step of the queue agreement calculation. */
export interface QueueAgreementFactor {
  describe(): string;
  adjust(item: QueueAgreement, value: number): number;
}

export class MinimumQueueAgreementAdjuster implements QueueAgreementFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: QueueAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentQueueAgreementAdjuster implements QueueAgreementFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: QueueAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredQueueAgreementAdjuster implements QueueAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: QueueAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapQueueAgreementAdjuster implements QueueAgreementFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: QueueAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the queue agreement steps in order and keeps a trace of each. */
export class QueueAgreementEngine {
  steps: QueueAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: QueueAgreement): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: QueueAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultQueueAgreementEngine(): QueueAgreementEngine {
  return new QueueAgreementEngine(
    [
      new MinimumQueueAgreementAdjuster(47),
      new PercentQueueAgreementAdjuster(-15.5),
      new TieredQueueAgreementAdjuster([1450, 9953], [1.15, 0.8]),
      new CapQueueAgreementAdjuster(38548),
    ],
    [],
    3.1,
    8562.2,
  );
}
