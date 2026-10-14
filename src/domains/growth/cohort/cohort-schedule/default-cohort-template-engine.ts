import * as numbers from "../../../../kit/numbers.js";
import { DefaultCohortTemplate } from "./default-cohort-template.js";

/** One step of the default cohort template calculation. */
export interface DefaultCohortTemplateModifier {
  describe(): string;
  adjust(item: DefaultCohortTemplate, value: number): number;
}

export class DefaultCohortTemplateUpdatedAtOffsetAdjuster implements DefaultCohortTemplateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: DefaultCohortTemplate, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class UnitDefaultCohortTemplateAdjuster implements DefaultCohortTemplateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: DefaultCohortTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumDefaultCohortTemplateAdjuster implements DefaultCohortTemplateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultCohortTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the default cohort template steps in order and keeps a trace of each. */
export class DefaultCohortTemplateEngine {
  steps: DefaultCohortTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultCohortTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultCohortTemplate): number {
    let current = item.projectedValue();
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

  evaluateAll(items: DefaultCohortTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultCohortTemplateEngine(): DefaultCohortTemplateEngine {
  return new DefaultCohortTemplateEngine(
    [
      new DefaultCohortTemplateUpdatedAtOffsetAdjuster(1.25),
      new UnitDefaultCohortTemplateAdjuster(new Map<string, number>([["retail", 1.15], ["west", 0.89]])),
      new MinimumDefaultCohortTemplateAdjuster(13.3),
    ],
    [],
    1.5,
    53115.4,
  );
}
