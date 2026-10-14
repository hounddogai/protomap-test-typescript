import { SubscriptionTemplate } from "./subscription-template.js";

/** One step of the subscription template calculation. */
export interface SubscriptionTemplateFactor {
  describe(): string;
  adjust(item: SubscriptionTemplate, value: number): number;
}

export class CapSubscriptionTemplateAdjuster implements SubscriptionTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SubscriptionTemplateImpressionsOffsetAdjuster implements SubscriptionTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: SubscriptionTemplate, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class NameSubscriptionTemplateAdjuster implements SubscriptionTemplateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: SubscriptionTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumSubscriptionTemplateAdjuster implements SubscriptionTemplateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SubscriptionTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the subscription template steps in order and keeps a trace of each. */
export class SubscriptionTemplateEngine {
  steps: SubscriptionTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SubscriptionTemplate): number {
    let current = item.netExposure();
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

  evaluateAll(items: SubscriptionTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSubscriptionTemplateEngine(): SubscriptionTemplateEngine {
  return new SubscriptionTemplateEngine(
    [
      new CapSubscriptionTemplateAdjuster(44530),
      new SubscriptionTemplateImpressionsOffsetAdjuster(1.49),
      new NameSubscriptionTemplateAdjuster(
        new Map<string, number>([["online", 1.07], ["south", 1.26], ["central", 1.01]]),
      ),
      new MinimumSubscriptionTemplateAdjuster(26.4),
    ],
    [],
    5,
    88033.2,
  );
}
