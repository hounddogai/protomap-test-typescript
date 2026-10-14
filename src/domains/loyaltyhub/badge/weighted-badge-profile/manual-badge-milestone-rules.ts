import { ManualBadgeMilestone } from "./manual-badge-milestone.js";

/** A rule a manual badge milestone must pass. Check returns its problems, or none. */
export interface ManualBadgeMilestoneRule {
  check(item: ManualBadgeMilestone): string[];
}

export class ManualBadgeMilestoneNameLengthRule implements ManualBadgeMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBadgeMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBadgeMilestoneCodePrefixRule implements ManualBadgeMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualBadgeMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualBadgeMilestoneRequiredNameRule implements ManualBadgeMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBadgeMilestone): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualBadgeMilestoneActiveGuardRule implements ManualBadgeMilestoneRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ManualBadgeMilestone): string[] {
    if (item.active && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while active`];
    return [];
  }
}

export class ManualBadgeMilestoneRequiredCurrencyRule implements ManualBadgeMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBadgeMilestone): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual badge milestone. */
export class ManualBadgeMilestoneValidator {
  rules: ManualBadgeMilestoneRule[];

  constructor(rules: ManualBadgeMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: ManualBadgeMilestone): string[] {
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

  requireValid(item: ManualBadgeMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualBadgeMilestone[]): Map<string, string[]> {
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

export function defaultManualBadgeMilestoneValidator(): ManualBadgeMilestoneValidator {
  return new ManualBadgeMilestoneValidator(
    [
      new ManualBadgeMilestoneNameLengthRule(255),
      new ManualBadgeMilestoneCodePrefixRule("REF"),
      new ManualBadgeMilestoneRequiredNameRule("manual badge milestone needs this field"),
      new ManualBadgeMilestoneActiveGuardRule(255),
      new ManualBadgeMilestoneRequiredCurrencyRule("manual badge milestone needs an entry"),
    ],
  );
}
