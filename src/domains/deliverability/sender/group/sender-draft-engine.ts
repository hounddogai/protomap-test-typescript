import { SenderDraft } from "./sender-draft.js";

/** One step of the sender draft calculation. */
export interface SenderDraftStep {
  describe(): string;
  adjust(item: SenderDraft, value: number): number;
}

export class PercentSenderDraftAdjuster implements SenderDraftStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SenderDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSenderDraftAdjuster implements SenderDraftStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SenderDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapSenderDraftAdjuster implements SenderDraftStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SenderDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the sender draft steps in order and keeps a trace of each. */
export class SenderDraftEngine {
  steps: SenderDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SenderDraft): number {
    let current = item.netVolume();
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

  evaluateAll(items: SenderDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSenderDraftEngine(): SenderDraftEngine {
  return new SenderDraftEngine(
    [
      new PercentSenderDraftAdjuster(-15.5),
      new MinimumSenderDraftAdjuster(49.5),
      new CapSenderDraftAdjuster(20048),
    ],
    [],
    0.9,
    2073,
  );
}
