import * as numbers from "../../../../kit/numbers.js";
import { WindowQuota } from "./window-quota.js";

/** One step of the window quota calculation. */
export interface WindowQuotaFactor {
  describe(): string;
  adjust(item: WindowQuota, value: number): number;
}

export class WindowQuotaDurationMinutesOffsetAdjuster implements WindowQuotaFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: WindowQuota, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class CapWindowQuotaAdjuster implements WindowQuotaFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentWindowQuotaAdjuster implements WindowQuotaFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WindowQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the window quota steps in order and keeps a trace of each. */
export class WindowQuotaEngine {
  steps: WindowQuotaFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowQuotaFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WindowQuota): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: WindowQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWindowQuotaEngine(): WindowQuotaEngine {
  return new WindowQuotaEngine(
    [
      new WindowQuotaDurationMinutesOffsetAdjuster(0.16),
      new CapWindowQuotaAdjuster(21102),
      new PercentWindowQuotaAdjuster(-22.8),
    ],
    [],
    0.3,
    59277.3,
  );
}
