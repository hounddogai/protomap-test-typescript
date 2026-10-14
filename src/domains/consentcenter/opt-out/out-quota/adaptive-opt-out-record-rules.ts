import { AdaptiveOptOutRecord } from "./adaptive-opt-out-record.js";

/** A rule a adaptive opt out record must pass. Check returns its problems, or none. */
export interface AdaptiveOptOutRecordRule {
  check(item: AdaptiveOptOutRecord): string[];
}

export class AdaptiveOptOutRecordCodePrefixRule implements AdaptiveOptOutRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveOptOutRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveOptOutRecordReviewerLengthRule implements AdaptiveOptOutRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveOptOutRecord): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveOptOutRecordLabelLengthRule implements AdaptiveOptOutRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveOptOutRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive opt out record. */
export class AdaptiveOptOutRecordValidator {
  rules: AdaptiveOptOutRecordRule[];

  constructor(rules: AdaptiveOptOutRecordRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveOptOutRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveOptOutRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveOptOutRecord[]): Map<string, string[]> {
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

export function defaultAdaptiveOptOutRecordValidator(): AdaptiveOptOutRecordValidator {
  return new AdaptiveOptOutRecordValidator(
    [
      new AdaptiveOptOutRecordCodePrefixRule("Q"),
      new AdaptiveOptOutRecordReviewerLengthRule(3600),
      new AdaptiveOptOutRecordLabelLengthRule(32),
    ],
  );
}
