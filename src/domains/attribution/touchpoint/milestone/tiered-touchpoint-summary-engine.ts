import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredTouchpointSummary } from "./tiered-touchpoint-summary.js";

/** One step of the tiered touchpoint summary calculation. */
export interface TieredTouchpointSummaryFactor {
  describe(): string;
  adjust(item: TieredTouchpointSummary, value: number): number;
}

export class FlaggedTieredTouchpointSummaryAdjuster implements TieredTouchpointSummaryFactor {
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

  adjust(item: TieredTouchpointSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredTouchpointSummaryAdjuster implements TieredTouchpointSummaryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredTouchpointSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentTieredTouchpointSummaryAdjuster implements TieredTouchpointSummaryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredTouchpointSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleTieredTouchpointSummaryAdjuster implements TieredTouchpointSummaryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: TieredTouchpointSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered touchpoint summary steps in order and keeps a trace of each. */
export class TieredTouchpointSummaryEngine {
  steps: TieredTouchpointSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredTouchpointSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredTouchpointSummary): number {
    let current = item.netVolume();
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

  evaluateAll(items: TieredTouchpointSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredTouchpointSummaryEngine(flagsValue: flags.Registry): TieredTouchpointSummaryEngine {
  return new TieredTouchpointSummaryEngine(
    [
      new FlaggedTieredTouchpointSummaryAdjuster(flagsValue, "tiered-touchpoint-summary-primary", -0.7),
      new CapTieredTouchpointSummaryAdjuster(6221),
      new PercentTieredTouchpointSummaryAdjuster(7.3),
      new LocaleTieredTouchpointSummaryAdjuster(
        new Map<string, number>([["east", 0.77], ["central", 1.35], ["online", 1.16]]),
      ),
    ],
    [],
    4.4,
    98797.9,
  );
}
