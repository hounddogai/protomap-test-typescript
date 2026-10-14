import * as numbers from "../../../../kit/numbers.js";
import { SlaPolicy } from "./sla-policy.js";

/** One step of the sla policy calculation. */
export interface SlaPolicyFactor {
  describe(): string;
  adjust(item: SlaPolicy, value: number): number;
}

export class CapSlaPolicyAdjuster implements SlaPolicyFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleSlaPolicyAdjuster implements SlaPolicyFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: SlaPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentSlaPolicyAdjuster implements SlaPolicyFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SlaPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the sla policy steps in order and keeps a trace of each. */
export class SlaPolicyEngine {
  steps: SlaPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SlaPolicy): number {
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

  evaluateAll(items: SlaPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSlaPolicyEngine(): SlaPolicyEngine {
  return new SlaPolicyEngine(
    [
      new CapSlaPolicyAdjuster(38605),
      new LocaleSlaPolicyAdjuster(new Map<string, number>([["retail", 0.72]])),
      new PercentSlaPolicyAdjuster(6.1),
    ],
    [],
    0.6,
    61977.6,
  );
}
