import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalTicketViewRecord } from "./regional-ticket-view-record.js";

/** One step of the regional ticket view record calculation. */
export interface RegionalTicketViewRecordAdjuster {
  describe(): string;
  adjust(item: RegionalTicketViewRecord, value: number): number;
}

export class CapRegionalTicketViewRecordAdjuster implements RegionalTicketViewRecordAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalTicketViewRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRegionalTicketViewRecordAdjuster implements RegionalTicketViewRecordAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalTicketViewRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRegionalTicketViewRecordAdjuster implements RegionalTicketViewRecordAdjuster {
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

  adjust(item: RegionalTicketViewRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionalTicketViewRecordSequenceOffsetAdjuster implements RegionalTicketViewRecordAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: RegionalTicketViewRecord, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class MinimumRegionalTicketViewRecordAdjuster implements RegionalTicketViewRecordAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalTicketViewRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRegionalTicketViewRecordAdjuster implements RegionalTicketViewRecordAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalTicketViewRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the regional ticket view record steps in order and keeps a trace of each. */
export class RegionalTicketViewRecordEngine {
  steps: RegionalTicketViewRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalTicketViewRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalTicketViewRecord): number {
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

  evaluateAll(items: RegionalTicketViewRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalTicketViewRecordEngine(flagsValue: flags.Registry): RegionalTicketViewRecordEngine {
  return new RegionalTicketViewRecordEngine(
    [
      new CapRegionalTicketViewRecordAdjuster(30334),
      new PercentRegionalTicketViewRecordAdjuster(-18.9),
      new FlaggedRegionalTicketViewRecordAdjuster(flagsValue, "regional-ticket-view-record-rolling", 3.4),
      new RegionalTicketViewRecordSequenceOffsetAdjuster(0.82),
      new MinimumRegionalTicketViewRecordAdjuster(24.2),
      new RoundingRegionalTicketViewRecordAdjuster(5),
    ],
    [],
    5,
    23052.7,
  );
}
