import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SlaTarget } from "./sla-target.js";

/** One step of the sla target calculation. */
export interface SlaTargetModifier {
  describe(): string;
  adjust(item: SlaTarget, value: number): number;
}

export class FlaggedSlaTargetAdjuster implements SlaTargetModifier {
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

  adjust(item: SlaTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSlaTargetAdjuster implements SlaTargetModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SlaTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingSlaTargetAdjuster implements SlaTargetModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentSlaTargetAdjuster implements SlaTargetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SlaTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SlaTargetEndsAtOffsetAdjuster implements SlaTargetModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: SlaTarget, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

/** Runs the sla target steps in order and keeps a trace of each. */
export class SlaTargetEngine {
  steps: SlaTargetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaTargetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SlaTarget): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SlaTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSlaTargetEngine(flagsValue: flags.Registry): SlaTargetEngine {
  return new SlaTargetEngine(
    [
      new FlaggedSlaTargetAdjuster(flagsValue, "sla-target-pending", -4.6),
      new MinimumSlaTargetAdjuster(23.2),
      new RoundingSlaTargetAdjuster(1),
      new PercentSlaTargetAdjuster(17.4),
      new SlaTargetEndsAtOffsetAdjuster(0.72),
    ],
    [],
    1.8,
    63009.1,
  );
}
