import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackModelLedger } from "./fallback-model-ledger.js";

/** One step of the fallback model ledger calculation. */
export interface FallbackModelLedgerAdjuster {
  describe(): string;
  adjust(item: FallbackModelLedger, value: number): number;
}

export class FlaggedFallbackModelLedgerAdjuster implements FallbackModelLedgerAdjuster {
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

  adjust(item: FallbackModelLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentFallbackModelLedgerAdjuster implements FallbackModelLedgerAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackModelLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackModelLedgerAdjuster implements FallbackModelLedgerAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackModelLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fallback model ledger steps in order and keeps a trace of each. */
export class FallbackModelLedgerEngine {
  steps: FallbackModelLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackModelLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackModelLedger): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: FallbackModelLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackModelLedgerEngine(flagsValue: flags.Registry): FallbackModelLedgerEngine {
  return new FallbackModelLedgerEngine(
    [
      new FlaggedFallbackModelLedgerAdjuster(flagsValue, "fallback-model-ledger-primary", 5.4),
      new PercentFallbackModelLedgerAdjuster(-20.4),
      new RoundingFallbackModelLedgerAdjuster(1),
    ],
    [],
    3.4,
    36349.6,
  );
}
