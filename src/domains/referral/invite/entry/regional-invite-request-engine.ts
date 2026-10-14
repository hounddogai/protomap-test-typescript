import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalInviteRequest } from "./regional-invite-request.js";

/** One step of the regional invite request calculation. */
export interface RegionalInviteRequestModifier {
  describe(): string;
  adjust(item: RegionalInviteRequest, value: number): number;
}

export class FlaggedRegionalInviteRequestAdjuster implements RegionalInviteRequestModifier {
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

  adjust(item: RegionalInviteRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRegionalInviteRequestAdjuster implements RegionalInviteRequestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalInviteRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRegionalInviteRequestAdjuster implements RegionalInviteRequestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalInviteRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the regional invite request steps in order and keeps a trace of each. */
export class RegionalInviteRequestEngine {
  steps: RegionalInviteRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalInviteRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalInviteRequest): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: RegionalInviteRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalInviteRequestEngine(flagsValue: flags.Registry): RegionalInviteRequestEngine {
  return new RegionalInviteRequestEngine(
    [
      new FlaggedRegionalInviteRequestAdjuster(flagsValue, "regional-invite-request-tiered", 3.8),
      new PercentRegionalInviteRequestAdjuster(-24.7),
      new CapRegionalInviteRequestAdjuster(45432),
    ],
    [],
    4.9,
    48320.2,
  );
}
