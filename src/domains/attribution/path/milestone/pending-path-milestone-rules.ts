import { PendingPathMilestone } from "./pending-path-milestone.js";

/** A rule a pending path milestone must pass. Check returns its problems, or none. */
export interface PendingPathMilestoneRule {
  check(item: PendingPathMilestone): string[];
}

export class PendingPathMilestoneRequiredCodeRule implements PendingPathMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPathMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingPathMilestoneCodeLengthRule implements PendingPathMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPathMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPathMilestoneChecksumLengthRule implements PendingPathMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPathMilestone): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPathMilestoneCodePrefixRule implements PendingPathMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingPathMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingPathMilestoneNameLengthRule implements PendingPathMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPathMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending path milestone. */
export class PendingPathMilestoneValidator {
  rules: PendingPathMilestoneRule[];

  constructor(rules: PendingPathMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: PendingPathMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingPathMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingPathMilestone[]): Map<string, string[]> {
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

export function defaultPendingPathMilestoneValidator(): PendingPathMilestoneValidator {
  return new PendingPathMilestoneValidator(
    [
      new PendingPathMilestoneRequiredCodeRule("pending path milestone needs this field"),
      new PendingPathMilestoneCodeLengthRule(86400),
      new PendingPathMilestoneChecksumLengthRule(86400),
      new PendingPathMilestoneCodePrefixRule("Q"),
      new PendingPathMilestoneNameLengthRule(80),
    ],
  );
}
