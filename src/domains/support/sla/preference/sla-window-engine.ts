import * as numbers from "../../../../kit/numbers.js";
import { SlaWindow } from "./sla-window.js";

/** One step of the sla window calculation. */
export interface SlaWindowFactor {
  describe(): string;
  adjust(item: SlaWindow, value: number): number;
}

export class RoundingSlaWindowAdjuster implements SlaWindowFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SlaWindowClicksOffsetAdjuster implements SlaWindowFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: SlaWindow, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class LabelSlaWindowAdjuster implements SlaWindowFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: SlaWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentSlaWindowAdjuster implements SlaWindowFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SlaWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapSlaWindowAdjuster implements SlaWindowFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the sla window steps in order and keeps a trace of each. */
export class SlaWindowEngine {
  steps: SlaWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SlaWindow): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: SlaWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSlaWindowEngine(): SlaWindowEngine {
  return new SlaWindowEngine(
    [
      new RoundingSlaWindowAdjuster(0.25),
      new SlaWindowClicksOffsetAdjuster(1.45),
      new LabelSlaWindowAdjuster(new Map<string, number>([["central", 0.93], ["west", 1.03], ["south", 1.16]])),
      new PercentSlaWindowAdjuster(13.8),
      new CapSlaWindowAdjuster(39254),
    ],
    [],
    2.9,
    84735.4,
  );
}
