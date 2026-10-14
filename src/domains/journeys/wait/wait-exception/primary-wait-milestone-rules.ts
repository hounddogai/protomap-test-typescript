import { PrimaryWaitMilestone } from "./primary-wait-milestone.js";

/** A rule a primary wait milestone must pass. Check returns its problems, or none. */
export interface PrimaryWaitMilestoneRule {
  check(item: PrimaryWaitMilestone): string[];
}

export class PrimaryWaitMilestoneCodePrefixRule implements PrimaryWaitMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryWaitMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryWaitMilestoneArchivedGuardRule implements PrimaryWaitMilestoneRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryWaitMilestone): string[] {
    if (item.archived && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PrimaryWaitMilestoneRequiredCodeRule implements PrimaryWaitMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryWaitMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryWaitMilestoneRequiredVariantRule implements PrimaryWaitMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryWaitMilestone): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryWaitMilestoneScoreRangeRule implements PrimaryWaitMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryWaitMilestone): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary wait milestone. */
export class PrimaryWaitMilestoneValidator {
  rules: PrimaryWaitMilestoneRule[];

  constructor(rules: PrimaryWaitMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryWaitMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryWaitMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryWaitMilestone[]): Map<string, string[]> {
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

export function defaultPrimaryWaitMilestoneValidator(): PrimaryWaitMilestoneValidator {
  return new PrimaryWaitMilestoneValidator(
    [
      new PrimaryWaitMilestoneCodePrefixRule("OPS"),
      new PrimaryWaitMilestoneArchivedGuardRule(3.4),
      new PrimaryWaitMilestoneRequiredCodeRule("primary wait milestone needs an entry"),
      new PrimaryWaitMilestoneRequiredVariantRule("primary wait milestone needs an entry"),
      new PrimaryWaitMilestoneScoreRangeRule(4.4, 4179),
    ],
  );
}
