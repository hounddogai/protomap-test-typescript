import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalEscalationRollup } from "./seasonal-escalation-rollup.js";

/** One step of the seasonal escalation rollup calculation. */
export interface SeasonalEscalationRollupModifier {
  describe(): string;
  adjust(item: SeasonalEscalationRollup, value: number): number;
}

export class SeasonalEscalationRollupSendAtOffsetAdjuster implements SeasonalEscalationRollupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: SeasonalEscalationRollup, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class RoundingSeasonalEscalationRollupAdjuster implements SeasonalEscalationRollupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalEscalationRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSeasonalEscalationRollupAdjuster implements SeasonalEscalationRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalEscalationRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedSeasonalEscalationRollupAdjuster implements SeasonalEscalationRollupModifier {
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

  adjust(item: SeasonalEscalationRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalEscalationRollupAdjuster implements SeasonalEscalationRollupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalEscalationRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the seasonal escalation rollup steps in order and keeps a trace of each. */
export class SeasonalEscalationRollupEngine {
  steps: SeasonalEscalationRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalEscalationRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalEscalationRollup): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: SeasonalEscalationRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalEscalationRollupEngine(flagsValue: flags.Registry): SeasonalEscalationRollupEngine {
  return new SeasonalEscalationRollupEngine(
    [
      new SeasonalEscalationRollupSendAtOffsetAdjuster(0.6),
      new RoundingSeasonalEscalationRollupAdjuster(0.05),
      new TieredSeasonalEscalationRollupAdjuster([476, 8289, 8879], [0.87, 1.16, 0.96]),
      new FlaggedSeasonalEscalationRollupAdjuster(flagsValue, "seasonal-escalation-rollup-lenient", 3.7),
      new MinimumSeasonalEscalationRollupAdjuster(48.2),
    ],
    [],
    4.6,
    82846.4,
  );
}
