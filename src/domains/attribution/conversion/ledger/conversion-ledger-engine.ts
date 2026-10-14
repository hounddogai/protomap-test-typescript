import * as numbers from "../../../../kit/numbers.js";
import { ConversionLedger } from "./conversion-ledger.js";

/** One step of the conversion ledger calculation. */
export interface ConversionLedgerModifier {
  describe(): string;
  adjust(item: ConversionLedger, value: number): number;
}

export class ConversionLedgerWeightOffsetAdjuster implements ConversionLedgerModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: ConversionLedger, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class RoundingConversionLedgerAdjuster implements ConversionLedgerModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumConversionLedgerAdjuster implements ConversionLedgerModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ConversionLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the conversion ledger steps in order and keeps a trace of each. */
export class ConversionLedgerEngine {
  steps: ConversionLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ConversionLedger): number {
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

  evaluateAll(items: ConversionLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultConversionLedgerEngine(): ConversionLedgerEngine {
  return new ConversionLedgerEngine(
    [
      new ConversionLedgerWeightOffsetAdjuster(0.81),
      new RoundingConversionLedgerAdjuster(0.05),
      new MinimumConversionLedgerAdjuster(37.7),
    ],
    [],
    0.6,
    79918,
  );
}
