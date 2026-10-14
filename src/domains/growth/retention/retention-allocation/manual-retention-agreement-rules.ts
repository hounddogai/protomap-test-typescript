import { ManualRetentionAgreement } from "./manual-retention-agreement.js";

/** A rule a manual retention agreement must pass. Check returns its problems, or none. */
export interface ManualRetentionAgreementRule {
  check(item: ManualRetentionAgreement): string[];
}

export class ManualRetentionAgreementRequiredCodeRule implements ManualRetentionAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualRetentionAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualRetentionAgreementRequiredOwnerIdRule implements ManualRetentionAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualRetentionAgreement): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class ManualRetentionAgreementScoreRangeRule implements ManualRetentionAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualRetentionAgreement): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualRetentionAgreementCreatedAtRangeRule implements ManualRetentionAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualRetentionAgreement): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualRetentionAgreementCodeLengthRule implements ManualRetentionAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRetentionAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual retention agreement. */
export class ManualRetentionAgreementValidator {
  rules: ManualRetentionAgreementRule[];

  constructor(rules: ManualRetentionAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ManualRetentionAgreement): string[] {
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

  requireValid(item: ManualRetentionAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualRetentionAgreement[]): Map<string, string[]> {
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

export function defaultManualRetentionAgreementValidator(): ManualRetentionAgreementValidator {
  return new ManualRetentionAgreementValidator(
    [
      new ManualRetentionAgreementRequiredCodeRule("manual retention agreement needs this field"),
      new ManualRetentionAgreementRequiredOwnerIdRule("manual retention agreement needs a value"),
      new ManualRetentionAgreementScoreRangeRule(3.4, 113.8),
      new ManualRetentionAgreementCreatedAtRangeRule(64, 120),
      new ManualRetentionAgreementCodeLengthRule(255),
    ],
  );
}
