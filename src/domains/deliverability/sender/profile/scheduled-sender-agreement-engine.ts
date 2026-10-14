import * as numbers from "../../../../kit/numbers.js";
import { ScheduledSenderAgreement } from "./scheduled-sender-agreement.js";

/** One step of the scheduled sender agreement calculation. */
export interface ScheduledSenderAgreementModifier {
  describe(): string;
  adjust(item: ScheduledSenderAgreement, value: number): number;
}

export class ScheduledSenderAgreementClicksOffsetAdjuster implements ScheduledSenderAgreementModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: ScheduledSenderAgreement, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class LabelScheduledSenderAgreementAdjuster implements ScheduledSenderAgreementModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ScheduledSenderAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingScheduledSenderAgreementAdjuster implements ScheduledSenderAgreementModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledSenderAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the scheduled sender agreement steps in order and keeps a trace of each. */
export class ScheduledSenderAgreementEngine {
  steps: ScheduledSenderAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledSenderAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledSenderAgreement): number {
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

  evaluateAll(items: ScheduledSenderAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledSenderAgreementEngine(): ScheduledSenderAgreementEngine {
  return new ScheduledSenderAgreementEngine(
    [
      new ScheduledSenderAgreementClicksOffsetAdjuster(0.82),
      new LabelScheduledSenderAgreementAdjuster(new Map<string, number>([["east", 1.32]])),
      new RoundingScheduledSenderAgreementAdjuster(0.5),
    ],
    [],
    0.5,
    62036.9,
  );
}
