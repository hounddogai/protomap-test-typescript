import * as numbers from "../../../../kit/numbers.js";
import { ScheduledCreditBundle } from "./scheduled-credit-bundle.js";

/** One step of the scheduled credit bundle calculation. */
export interface ScheduledCreditBundleFactor {
  describe(): string;
  adjust(item: ScheduledCreditBundle, value: number): number;
}

export class PercentScheduledCreditBundleAdjuster implements ScheduledCreditBundleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledCreditBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ScheduledCreditBundleSendAtOffsetAdjuster implements ScheduledCreditBundleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: ScheduledCreditBundle, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class RoundingScheduledCreditBundleAdjuster implements ScheduledCreditBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledCreditBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the scheduled credit bundle steps in order and keeps a trace of each. */
export class ScheduledCreditBundleEngine {
  steps: ScheduledCreditBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledCreditBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledCreditBundle): number {
    let current = item.netVolume();
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

  evaluateAll(items: ScheduledCreditBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledCreditBundleEngine(): ScheduledCreditBundleEngine {
  return new ScheduledCreditBundleEngine(
    [
      new PercentScheduledCreditBundleAdjuster(-0.1),
      new ScheduledCreditBundleSendAtOffsetAdjuster(0.08),
      new RoundingScheduledCreditBundleAdjuster(0.1),
    ],
    [],
    4,
    14566.9,
  );
}
