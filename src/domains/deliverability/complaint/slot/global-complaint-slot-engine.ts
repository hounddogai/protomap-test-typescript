import * as numbers from "../../../../kit/numbers.js";
import { GlobalComplaintSlot } from "./global-complaint-slot.js";

/** One step of the global complaint slot calculation. */
export interface GlobalComplaintSlotAdjuster {
  describe(): string;
  adjust(item: GlobalComplaintSlot, value: number): number;
}

export class RoundingGlobalComplaintSlotAdjuster implements GlobalComplaintSlotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalComplaintSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumGlobalComplaintSlotAdjuster implements GlobalComplaintSlotAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalComplaintSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameGlobalComplaintSlotAdjuster implements GlobalComplaintSlotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: GlobalComplaintSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global complaint slot steps in order and keeps a trace of each. */
export class GlobalComplaintSlotEngine {
  steps: GlobalComplaintSlotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalComplaintSlotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalComplaintSlot): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: GlobalComplaintSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalComplaintSlotEngine(): GlobalComplaintSlotEngine {
  return new GlobalComplaintSlotEngine(
    [
      new RoundingGlobalComplaintSlotAdjuster(5),
      new MinimumGlobalComplaintSlotAdjuster(1),
      new NameGlobalComplaintSlotAdjuster(
        new Map<string, number>([["retail", 1.03], ["central", 1.27], ["west", 0.76]]),
      ),
    ],
    [],
    4.6,
    57518.6,
  );
}
