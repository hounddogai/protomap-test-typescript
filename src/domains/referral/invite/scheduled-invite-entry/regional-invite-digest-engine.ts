import * as numbers from "../../../../kit/numbers.js";
import { RegionalInviteDigest } from "./regional-invite-digest.js";

/** One step of the regional invite digest calculation. */
export interface RegionalInviteDigestStep {
  describe(): string;
  adjust(item: RegionalInviteDigest, value: number): number;
}

export class CapRegionalInviteDigestAdjuster implements RegionalInviteDigestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalInviteDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionalInviteDigestFrequencyCapOffsetAdjuster implements RegionalInviteDigestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: RegionalInviteDigest, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class PercentRegionalInviteDigestAdjuster implements RegionalInviteDigestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalInviteDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalInviteDigestAdjuster implements RegionalInviteDigestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalInviteDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the regional invite digest steps in order and keeps a trace of each. */
export class RegionalInviteDigestEngine {
  steps: RegionalInviteDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalInviteDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalInviteDigest): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: RegionalInviteDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalInviteDigestEngine(): RegionalInviteDigestEngine {
  return new RegionalInviteDigestEngine(
    [
      new CapRegionalInviteDigestAdjuster(5335),
      new RegionalInviteDigestFrequencyCapOffsetAdjuster(0.82),
      new PercentRegionalInviteDigestAdjuster(13.5),
      new RoundingRegionalInviteDigestAdjuster(0.5),
    ],
    [],
    2.6,
    73918.4,
  );
}
