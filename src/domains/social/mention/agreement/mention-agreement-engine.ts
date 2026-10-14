import * as numbers from "../../../../kit/numbers.js";
import { MentionAgreement } from "./mention-agreement.js";

/** One step of the mention agreement calculation. */
export interface MentionAgreementFactor {
  describe(): string;
  adjust(item: MentionAgreement, value: number): number;
}

export class RoundingMentionAgreementAdjuster implements MentionAgreementFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredMentionAgreementAdjuster implements MentionAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MentionAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentMentionAgreementAdjuster implements MentionAgreementFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MentionAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the mention agreement steps in order and keeps a trace of each. */
export class MentionAgreementEngine {
  steps: MentionAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: MentionAgreement): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: MentionAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultMentionAgreementEngine(): MentionAgreementEngine {
  return new MentionAgreementEngine(
    [
      new RoundingMentionAgreementAdjuster(0.1),
      new TieredMentionAgreementAdjuster([3590, 8592, 9934], [0.85, 1.09, 1.15]),
      new PercentMentionAgreementAdjuster(-21.4),
    ],
    [],
    0.3,
    79413.5,
  );
}
