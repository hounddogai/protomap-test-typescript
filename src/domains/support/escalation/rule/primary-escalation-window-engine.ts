import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryEscalationWindow } from "./primary-escalation-window.js";

/** One step of the primary escalation window calculation. */
export interface PrimaryEscalationWindowStep {
  describe(): string;
  adjust(item: PrimaryEscalationWindow, value: number): number;
}

export class PrimaryEscalationWindowRetriesOffsetAdjuster implements PrimaryEscalationWindowStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: PrimaryEscalationWindow, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class FlaggedPrimaryEscalationWindowAdjuster implements PrimaryEscalationWindowStep {
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

  adjust(item: PrimaryEscalationWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryEscalationWindowAdjuster implements PrimaryEscalationWindowStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryEscalationWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary escalation window steps in order and keeps a trace of each. */
export class PrimaryEscalationWindowEngine {
  steps: PrimaryEscalationWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryEscalationWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryEscalationWindow): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: PrimaryEscalationWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryEscalationWindowEngine(flagsValue: flags.Registry): PrimaryEscalationWindowEngine {
  return new PrimaryEscalationWindowEngine(
    [
      new PrimaryEscalationWindowRetriesOffsetAdjuster(0.25),
      new FlaggedPrimaryEscalationWindowAdjuster(flagsValue, "primary-escalation-window-global", -0.7),
      new RoundingPrimaryEscalationWindowAdjuster(0.05),
    ],
    [],
    3.3,
    53470.2,
  );
}
