import { LegacyTouchpointTemplate } from "./legacy-touchpoint-template.js";

/** One step of the legacy touchpoint template calculation. */
export interface LegacyTouchpointTemplateStep {
  describe(): string;
  adjust(item: LegacyTouchpointTemplate, value: number): number;
}

export class CapLegacyTouchpointTemplateAdjuster implements LegacyTouchpointTemplateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyTouchpointTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumLegacyTouchpointTemplateAdjuster implements LegacyTouchpointTemplateStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyTouchpointTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LegacyTouchpointTemplateCreatedAtOffsetAdjuster implements LegacyTouchpointTemplateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: LegacyTouchpointTemplate, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the legacy touchpoint template steps in order and keeps a trace of each. */
export class LegacyTouchpointTemplateEngine {
  steps: LegacyTouchpointTemplateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyTouchpointTemplateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyTouchpointTemplate): number {
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

  evaluateAll(items: LegacyTouchpointTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyTouchpointTemplateEngine(): LegacyTouchpointTemplateEngine {
  return new LegacyTouchpointTemplateEngine(
    [
      new CapLegacyTouchpointTemplateAdjuster(35897),
      new MinimumLegacyTouchpointTemplateAdjuster(17),
      new LegacyTouchpointTemplateCreatedAtOffsetAdjuster(1.85),
    ],
    [],
    2.3,
    40181.9,
  );
}
