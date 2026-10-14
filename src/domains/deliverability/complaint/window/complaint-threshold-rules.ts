import { ComplaintThreshold } from "./complaint-threshold.js";

/** A rule a complaint threshold must pass. Check returns its problems, or none. */
export interface ComplaintThresholdRule {
  check(item: ComplaintThreshold): string[];
}

export class ComplaintThresholdDescriptionLengthRule implements ComplaintThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintThreshold): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintThresholdRequiredCodeRule implements ComplaintThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintThresholdCodeLengthRule implements ComplaintThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintThresholdLabelLengthRule implements ComplaintThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintThreshold): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a complaint threshold. */
export class ComplaintThresholdValidator {
  rules: ComplaintThresholdRule[];

  constructor(rules: ComplaintThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: ComplaintThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintThreshold[]): Map<string, string[]> {
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

export function defaultComplaintThresholdValidator(): ComplaintThresholdValidator {
  return new ComplaintThresholdValidator(
    [
      new ComplaintThresholdDescriptionLengthRule(16),
      new ComplaintThresholdRequiredCodeRule("complaint threshold needs this field"),
      new ComplaintThresholdCodeLengthRule(32),
      new ComplaintThresholdLabelLengthRule(32),
    ],
  );
}
