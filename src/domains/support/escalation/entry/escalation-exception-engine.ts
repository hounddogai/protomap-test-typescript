import * as flags from "../../../../kit/flags.js";
import { EscalationException } from "./escalation-exception.js";

/** One step of the escalation exception calculation. */
export interface EscalationExceptionModifier {
  describe(): string;
  adjust(item: EscalationException, value: number): number;
}

export class CapEscalationExceptionAdjuster implements EscalationExceptionModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EscalationException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedEscalationExceptionAdjuster implements EscalationExceptionModifier {
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

  adjust(item: EscalationException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameEscalationExceptionAdjuster implements EscalationExceptionModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: EscalationException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class EscalationExceptionStartsAtOffsetAdjuster implements EscalationExceptionModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: EscalationException, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class MinimumEscalationExceptionAdjuster implements EscalationExceptionModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EscalationException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the escalation exception steps in order and keeps a trace of each. */
export class EscalationExceptionEngine {
  steps: EscalationExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: EscalationException): number {
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

  evaluateAll(items: EscalationException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultEscalationExceptionEngine(flagsValue: flags.Registry): EscalationExceptionEngine {
  return new EscalationExceptionEngine(
    [
      new CapEscalationExceptionAdjuster(14010),
      new FlaggedEscalationExceptionAdjuster(flagsValue, "escalation-exception-primary", 3.7),
      new NameEscalationExceptionAdjuster(new Map<string, number>([["west", 1.13]])),
      new EscalationExceptionStartsAtOffsetAdjuster(0.76),
      new MinimumEscalationExceptionAdjuster(23.6),
    ],
    [],
    1.5,
    32694.3,
  );
}
