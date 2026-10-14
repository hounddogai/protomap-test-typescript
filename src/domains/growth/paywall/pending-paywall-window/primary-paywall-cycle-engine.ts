import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryPaywallCycle } from "./primary-paywall-cycle.js";

/** One step of the primary paywall cycle calculation. */
export interface PrimaryPaywallCycleModifier {
  describe(): string;
  adjust(item: PrimaryPaywallCycle, value: number): number;
}

export class PercentPrimaryPaywallCycleAdjuster implements PrimaryPaywallCycleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryPaywallCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPrimaryPaywallCycleAdjuster implements PrimaryPaywallCycleModifier {
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

  adjust(item: PrimaryPaywallCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryPaywallCycleAdjuster implements PrimaryPaywallCycleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryPaywallCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary paywall cycle steps in order and keeps a trace of each. */
export class PrimaryPaywallCycleEngine {
  steps: PrimaryPaywallCycleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryPaywallCycleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryPaywallCycle): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: PrimaryPaywallCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryPaywallCycleEngine(flagsValue: flags.Registry): PrimaryPaywallCycleEngine {
  return new PrimaryPaywallCycleEngine(
    [
      new PercentPrimaryPaywallCycleAdjuster(11.8),
      new FlaggedPrimaryPaywallCycleAdjuster(flagsValue, "primary-paywall-cycle-primary", 5.5),
      new RoundingPrimaryPaywallCycleAdjuster(0.1),
    ],
    [],
    0.1,
    56277.3,
  );
}
