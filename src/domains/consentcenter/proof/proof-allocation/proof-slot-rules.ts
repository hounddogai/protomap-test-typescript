import { ProofSlot } from "./proof-slot.js";

/** A rule a proof slot must pass. Check returns its problems, or none. */
export interface ProofSlotRule {
  check(item: ProofSlot): string[];
}

export class ProofSlotConversionRateRangeRule implements ProofSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofSlot): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ProofSlotRequiredCodeRule implements ProofSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ProofSlotCapacityRangeRule implements ProofSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofSlot): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ProofSlotJourneyIdLengthRule implements ProofSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofSlot): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofSlotRequiredJourneyIdRule implements ProofSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofSlot): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class ProofSlotOpenRateRangeRule implements ProofSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofSlot): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a proof slot. */
export class ProofSlotValidator {
  rules: ProofSlotRule[];

  constructor(rules: ProofSlotRule[]) {
    this.rules = rules;
  }

  validate(item: ProofSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ProofSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofSlot[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultProofSlotValidator(): ProofSlotValidator {
  return new ProofSlotValidator(
    [
      new ProofSlotConversionRateRangeRule(9.2, 4650.5),
      new ProofSlotRequiredCodeRule("proof slot needs an entry"),
      new ProofSlotCapacityRangeRule(16, 64),
      new ProofSlotJourneyIdLengthRule(32),
      new ProofSlotRequiredJourneyIdRule("proof slot needs an entry"),
      new ProofSlotOpenRateRangeRule(2.7, 1055.1),
    ],
  );
}
