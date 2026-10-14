import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultFlightLedger } from "./default-flight-ledger.js";

/** One step of the default flight ledger calculation. */
export interface DefaultFlightLedgerModifier {
  describe(): string;
  adjust(item: DefaultFlightLedger, value: number): number;
}

export class FlaggedDefaultFlightLedgerAdjuster implements DefaultFlightLedgerModifier {
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

  adjust(item: DefaultFlightLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapDefaultFlightLedgerAdjuster implements DefaultFlightLedgerModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultFlightLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class DefaultFlightLedgerThresholdOffsetAdjuster implements DefaultFlightLedgerModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: DefaultFlightLedger, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class RoundingDefaultFlightLedgerAdjuster implements DefaultFlightLedgerModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultFlightLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the default flight ledger steps in order and keeps a trace of each. */
export class DefaultFlightLedgerEngine {
  steps: DefaultFlightLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultFlightLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultFlightLedger): number {
    let current = item.measuredValue();
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

  evaluateAll(items: DefaultFlightLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultFlightLedgerEngine(flagsValue: flags.Registry): DefaultFlightLedgerEngine {
  return new DefaultFlightLedgerEngine(
    [
      new FlaggedDefaultFlightLedgerAdjuster(flagsValue, "default-flight-ledger-capped", 0.4),
      new CapDefaultFlightLedgerAdjuster(23063),
      new DefaultFlightLedgerThresholdOffsetAdjuster(0.87),
      new RoundingDefaultFlightLedgerAdjuster(0.05),
    ],
    [],
    1.6,
    32088.1,
  );
}
