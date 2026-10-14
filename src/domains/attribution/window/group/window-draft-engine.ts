import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WindowDraft } from "./window-draft.js";

/** One step of the window draft calculation. */
export interface WindowDraftFactor {
  describe(): string;
  adjust(item: WindowDraft, value: number): number;
}

export class TieredWindowDraftAdjuster implements WindowDraftFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WindowDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedWindowDraftAdjuster implements WindowDraftFactor {
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

  adjust(item: WindowDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentWindowDraftAdjuster implements WindowDraftFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WindowDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the window draft steps in order and keeps a trace of each. */
export class WindowDraftEngine {
  steps: WindowDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WindowDraft): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: WindowDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWindowDraftEngine(flagsValue: flags.Registry): WindowDraftEngine {
  return new WindowDraftEngine(
    [
      new TieredWindowDraftAdjuster([7582, 8627, 8818, 9689], [1.18, 1.12, 0.91, 1.06]),
      new FlaggedWindowDraftAdjuster(flagsValue, "window-draft-primary", -6.2),
      new PercentWindowDraftAdjuster(-0.2),
    ],
    [],
    0.2,
    87643.2,
  );
}
