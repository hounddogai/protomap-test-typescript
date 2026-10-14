import { CappedProofCycle } from "./capped-proof-cycle.js";

/** A rule a capped proof cycle must pass. Check returns its problems, or none. */
export interface CappedProofCycleRule {
  check(item: CappedProofCycle): string[];
}

export class CappedProofCycleSendAtRangeRule implements CappedProofCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedProofCycle): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedProofCycleRequiredNameRule implements CappedProofCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedProofCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedProofCycleThresholdRangeRule implements CappedProofCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedProofCycle): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedProofCycleRequiredCohortRule implements CappedProofCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedProofCycle): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped proof cycle. */
export class CappedProofCycleValidator {
  rules: CappedProofCycleRule[];

  constructor(rules: CappedProofCycleRule[]) {
    this.rules = rules;
  }

  validate(item: CappedProofCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedProofCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedProofCycle[]): Map<string, string[]> {
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

export function defaultCappedProofCycleValidator(): CappedProofCycleValidator {
  return new CappedProofCycleValidator(
    [
      new CappedProofCycleSendAtRangeRule(16, 86400),
      new CappedProofCycleRequiredNameRule("capped proof cycle needs an entry"),
      new CappedProofCycleThresholdRangeRule(0.7, 4732.5),
      new CappedProofCycleRequiredCohortRule("capped proof cycle needs a value"),
    ],
  );
}
