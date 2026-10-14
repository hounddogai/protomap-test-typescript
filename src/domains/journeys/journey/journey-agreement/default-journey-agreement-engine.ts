import { DefaultJourneyAgreement } from "./default-journey-agreement.js";

/** One step of the default journey agreement calculation. */
export interface DefaultJourneyAgreementModifier {
  describe(): string;
  adjust(item: DefaultJourneyAgreement, value: number): number;
}

export class DefaultJourneyAgreementBudgetOffsetAdjuster implements DefaultJourneyAgreementModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: DefaultJourneyAgreement, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class CapDefaultJourneyAgreementAdjuster implements DefaultJourneyAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultJourneyAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelDefaultJourneyAgreementAdjuster implements DefaultJourneyAgreementModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: DefaultJourneyAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the default journey agreement steps in order and keeps a trace of each. */
export class DefaultJourneyAgreementEngine {
  steps: DefaultJourneyAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultJourneyAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultJourneyAgreement): number {
    let current = item.netTotal();
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

  evaluateAll(items: DefaultJourneyAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultJourneyAgreementEngine(): DefaultJourneyAgreementEngine {
  return new DefaultJourneyAgreementEngine(
    [
      new DefaultJourneyAgreementBudgetOffsetAdjuster(1.04),
      new CapDefaultJourneyAgreementAdjuster(5612),
      new ChannelDefaultJourneyAgreementAdjuster(new Map<string, number>([["east", 1.27], ["online", 0.71]])),
    ],
    [],
    3.7,
    8185.8,
  );
}
