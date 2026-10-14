import { PrimaryMacroEstimate } from "./primary-macro-estimate.js";

/** A rule a primary macro estimate must pass. Check returns its problems, or none. */
export interface PrimaryMacroEstimateRule {
  check(item: PrimaryMacroEstimate): string[];
}

export class PrimaryMacroEstimateCodeLengthRule implements PrimaryMacroEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryMacroEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryMacroEstimateRequiredNotesRule implements PrimaryMacroEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryMacroEstimate): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryMacroEstimateRequiredCodeRule implements PrimaryMacroEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryMacroEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryMacroEstimateEndsAtRangeRule implements PrimaryMacroEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryMacroEstimate): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryMacroEstimateNameLengthRule implements PrimaryMacroEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryMacroEstimate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary macro estimate. */
export class PrimaryMacroEstimateValidator {
  rules: PrimaryMacroEstimateRule[];

  constructor(rules: PrimaryMacroEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryMacroEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryMacroEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryMacroEstimate[]): Map<string, string[]> {
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

export function defaultPrimaryMacroEstimateValidator(): PrimaryMacroEstimateValidator {
  return new PrimaryMacroEstimateValidator(
    [
      new PrimaryMacroEstimateCodeLengthRule(32),
      new PrimaryMacroEstimateRequiredNotesRule("primary macro estimate needs an entry"),
      new PrimaryMacroEstimateRequiredCodeRule("primary macro estimate needs a value"),
      new PrimaryMacroEstimateEndsAtRangeRule(80, 3600),
      new PrimaryMacroEstimateNameLengthRule(1000),
    ],
  );
}
