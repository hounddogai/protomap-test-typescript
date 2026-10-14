import * as numbers from "../../../../kit/numbers.js";
import { WaitTemplate } from "./wait-template.js";

/** One step of the wait template calculation. */
export interface WaitTemplateFactor {
  describe(): string;
  adjust(item: WaitTemplate, value: number): number;
}

export class CapWaitTemplateAdjuster implements WaitTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WaitTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentWaitTemplateAdjuster implements WaitTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SourceWaitTemplateAdjuster implements WaitTemplateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: WaitTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the wait template steps in order and keeps a trace of each. */
export class WaitTemplateEngine {
  steps: WaitTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WaitTemplate): number {
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

  evaluateAll(items: WaitTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWaitTemplateEngine(): WaitTemplateEngine {
  return new WaitTemplateEngine(
    [
      new CapWaitTemplateAdjuster(34100),
      new PercentWaitTemplateAdjuster(5.2),
      new SourceWaitTemplateAdjuster(
        new Map<string, number>([["online", 1.36], ["central", 1.14], ["east", 1.28]]),
      ),
    ],
    [],
    2.1,
    78084.3,
  );
}
