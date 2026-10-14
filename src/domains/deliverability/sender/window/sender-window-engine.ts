import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SenderWindow } from "./sender-window.js";

/** One step of the sender window calculation. */
export interface SenderWindowFactor {
  describe(): string;
  adjust(item: SenderWindow, value: number): number;
}

export class FlaggedSenderWindowAdjuster implements SenderWindowFactor {
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

  adjust(item: SenderWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSenderWindowAdjuster implements SenderWindowFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SenderWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SenderWindowFloorValueOffsetAdjuster implements SenderWindowFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: SenderWindow, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class MinimumSenderWindowAdjuster implements SenderWindowFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SenderWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapSenderWindowAdjuster implements SenderWindowFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SenderWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the sender window steps in order and keeps a trace of each. */
export class SenderWindowEngine {
  steps: SenderWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SenderWindow): number {
    let current = item.weightedValue();
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

  evaluateAll(items: SenderWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSenderWindowEngine(flagsValue: flags.Registry): SenderWindowEngine {
  return new SenderWindowEngine(
    [
      new FlaggedSenderWindowAdjuster(flagsValue, "sender-window-tiered", 3.4),
      new RoundingSenderWindowAdjuster(1),
      new SenderWindowFloorValueOffsetAdjuster(0.92),
      new MinimumSenderWindowAdjuster(39.7),
      new CapSenderWindowAdjuster(49572),
    ],
    [],
    4.8,
    45096.3,
  );
}
