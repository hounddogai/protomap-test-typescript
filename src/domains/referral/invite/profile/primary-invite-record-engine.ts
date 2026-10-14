import { PrimaryInviteRecord } from "./primary-invite-record.js";

/** One step of the primary invite record calculation. */
export interface PrimaryInviteRecordModifier {
  describe(): string;
  adjust(item: PrimaryInviteRecord, value: number): number;
}

export class TieredPrimaryInviteRecordAdjuster implements PrimaryInviteRecordModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryInviteRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocalePrimaryInviteRecordAdjuster implements PrimaryInviteRecordModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PrimaryInviteRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PrimaryInviteRecordStartsAtOffsetAdjuster implements PrimaryInviteRecordModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: PrimaryInviteRecord, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

/** Runs the primary invite record steps in order and keeps a trace of each. */
export class PrimaryInviteRecordEngine {
  steps: PrimaryInviteRecordModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryInviteRecordModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryInviteRecord): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PrimaryInviteRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryInviteRecordEngine(): PrimaryInviteRecordEngine {
  return new PrimaryInviteRecordEngine(
    [
      new TieredPrimaryInviteRecordAdjuster([922, 6145], [1.09, 1.04]),
      new LocalePrimaryInviteRecordAdjuster(new Map<string, number>([["west", 1.23]])),
      new PrimaryInviteRecordStartsAtOffsetAdjuster(1.81),
    ],
    [],
    3.4,
    22445.8,
  );
}
