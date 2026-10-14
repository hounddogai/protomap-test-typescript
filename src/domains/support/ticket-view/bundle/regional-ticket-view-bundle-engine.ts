import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalTicketViewBundle } from "./regional-ticket-view-bundle.js";

/** One step of the regional ticket view bundle calculation. */
export interface RegionalTicketViewBundleFactor {
  describe(): string;
  adjust(item: RegionalTicketViewBundle, value: number): number;
}

export class PercentRegionalTicketViewBundleAdjuster implements RegionalTicketViewBundleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalTicketViewBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalTicketViewBundleAdjuster implements RegionalTicketViewBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalTicketViewBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRegionalTicketViewBundleAdjuster implements RegionalTicketViewBundleFactor {
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

  adjust(item: RegionalTicketViewBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional ticket view bundle steps in order and keeps a trace of each. */
export class RegionalTicketViewBundleEngine {
  steps: RegionalTicketViewBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalTicketViewBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalTicketViewBundle): number {
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

  evaluateAll(items: RegionalTicketViewBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalTicketViewBundleEngine(flagsValue: flags.Registry): RegionalTicketViewBundleEngine {
  return new RegionalTicketViewBundleEngine(
    [
      new PercentRegionalTicketViewBundleAdjuster(21.5),
      new RoundingRegionalTicketViewBundleAdjuster(0.5),
      new FlaggedRegionalTicketViewBundleAdjuster(flagsValue, "regional-ticket-view-bundle-default", -3.7),
    ],
    [],
    0.6,
    25233.6,
  );
}
