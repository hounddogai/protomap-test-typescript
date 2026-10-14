import { ApprovalWindow } from "./approval-window.js";

/** A rule a approval window must pass. Check returns its problems, or none. */
export interface ApprovalWindowRule {
  check(item: ApprovalWindow): string[];
}

export class ApprovalWindowScoreRangeRule implements ApprovalWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalWindow): string[] {
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

export class ApprovalWindowOwnerIdLengthRule implements ApprovalWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalWindow): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalWindowCodePrefixRule implements ApprovalWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ApprovalWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ApprovalWindowRequiredOwnerIdRule implements ApprovalWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalWindow): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalWindowRetriesRangeRule implements ApprovalWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalWindow): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a approval window. */
export class ApprovalWindowValidator {
  rules: ApprovalWindowRule[];

  constructor(rules: ApprovalWindowRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalWindow): string[] {
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

  requireValid(item: ApprovalWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalWindow[]): Map<string, string[]> {
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

export function defaultApprovalWindowValidator(): ApprovalWindowValidator {
  return new ApprovalWindowValidator(
    [
      new ApprovalWindowScoreRangeRule(7.4, 2507.2),
      new ApprovalWindowOwnerIdLengthRule(3600),
      new ApprovalWindowCodePrefixRule("X"),
      new ApprovalWindowRequiredOwnerIdRule("approval window needs an entry"),
      new ApprovalWindowRetriesRangeRule(32, 80),
    ],
  );
}
