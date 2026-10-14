import * as numbers from "../../../../kit/numbers.js";
import { CappedConversionPolicy } from "./capped-conversion-policy.js";

/** One step of the capped conversion policy calculation. */
export interface CappedConversionPolicyModifier {
  describe(): string;
  adjust(item: CappedConversionPolicy, value: number): number;
}

export class CapCappedConversionPolicyAdjuster implements CappedConversionPolicyModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedConversionPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCappedConversionPolicyAdjuster implements CappedConversionPolicyModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedConversionPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCappedConversionPolicyAdjuster implements CappedConversionPolicyModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedConversionPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the capped conversion policy steps in order and keeps a trace of each. */
export class CappedConversionPolicyEngine {
  steps: CappedConversionPolicyModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedConversionPolicyModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedConversionPolicy): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: CappedConversionPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedConversionPolicyEngine(): CappedConversionPolicyEngine {
  return new CappedConversionPolicyEngine(
    [
      new CapCappedConversionPolicyAdjuster(23650),
      new RoundingCappedConversionPolicyAdjuster(0.25),
      new MinimumCappedConversionPolicyAdjuster(25.9),
    ],
    [],
    1.2,
    76062.5,
  );
}
