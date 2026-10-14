import { ActivationRequest } from "./activation-request.js";

/** One step of the activation request calculation. */
export interface ActivationRequestFactor {
  describe(): string;
  adjust(item: ActivationRequest, value: number): number;
}

export class MinimumActivationRequestAdjuster implements ActivationRequestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ActivationRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ChannelActivationRequestAdjuster implements ActivationRequestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ActivationRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ActivationRequestRevisionOffsetAdjuster implements ActivationRequestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: ActivationRequest, value: number): number {
    return value + item.revision * this.weight;
  }
}

/** Runs the activation request steps in order and keeps a trace of each. */
export class ActivationRequestEngine {
  steps: ActivationRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ActivationRequest): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: ActivationRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultActivationRequestEngine(): ActivationRequestEngine {
  return new ActivationRequestEngine(
    [
      new MinimumActivationRequestAdjuster(9.3),
      new ChannelActivationRequestAdjuster(
        new Map<string, number>([["south", 0.73], ["east", 1.09], ["central", 1.14]]),
      ),
      new ActivationRequestRevisionOffsetAdjuster(1.86),
    ],
    [],
    3.9,
    21780.5,
  );
}
