import { JourneyOverride } from "./journey-override.js";

/** One step of the journey override calculation. */
export interface JourneyOverrideModifier {
  describe(): string;
  adjust(item: JourneyOverride, value: number): number;
}

export class CategoryJourneyOverrideAdjuster implements JourneyOverrideModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: JourneyOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class JourneyOverrideVersionOffsetAdjuster implements JourneyOverrideModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: JourneyOverride, value: number): number {
    return value + item.version * this.weight;
  }
}

export class MinimumJourneyOverrideAdjuster implements JourneyOverrideModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: JourneyOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the journey override steps in order and keeps a trace of each. */
export class JourneyOverrideEngine {
  steps: JourneyOverrideModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyOverrideModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: JourneyOverride): number {
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

  evaluateAll(items: JourneyOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultJourneyOverrideEngine(): JourneyOverrideEngine {
  return new JourneyOverrideEngine(
    [
      new CategoryJourneyOverrideAdjuster(new Map<string, number>([["central", 1.19], ["online", 0.73]])),
      new JourneyOverrideVersionOffsetAdjuster(1.7),
      new MinimumJourneyOverrideAdjuster(43),
    ],
    [],
    0.8,
    23325.9,
  );
}
