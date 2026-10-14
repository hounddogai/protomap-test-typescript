import * as text from "../../../../kit/text.js";
import { RollingQueueOverride } from "./rolling-queue-override.js";

/** A rule a rolling queue override must pass. Check returns its problems, or none. */
export interface RollingQueueOverrideRule {
  check(item: RollingQueueOverride): string[];
}

export class RollingQueueOverrideActiveGuardRule implements RollingQueueOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingQueueOverride): string[] {
    if (item.active && item.conversionRate > this.limit) return [`conversion rate ${item.conversionRate} exceeds ${this.limit} while active`];
    return [];
  }
}

export class RollingQueueOverrideNameLengthRule implements RollingQueueOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingQueueOverride): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingQueueOverrideRequiredCohortRule implements RollingQueueOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingQueueOverride): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class RollingQueueOverrideCohortLengthRule implements RollingQueueOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingQueueOverride): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingQueueOverrideAllowedCodeRule implements RollingQueueOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingQueueOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

/** Runs every rule of a rolling queue override. */
export class RollingQueueOverrideValidator {
  rules: RollingQueueOverrideRule[];

  constructor(rules: RollingQueueOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: RollingQueueOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingQueueOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingQueueOverride[]): Map<string, string[]> {
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

export function defaultRollingQueueOverrideValidator(): RollingQueueOverrideValidator {
  return new RollingQueueOverrideValidator(
    [
      new RollingQueueOverrideActiveGuardRule(6.4),
      new RollingQueueOverrideNameLengthRule(32),
      new RollingQueueOverrideRequiredCohortRule("rolling queue override needs an entry"),
      new RollingQueueOverrideCohortLengthRule(64),
      new RollingQueueOverrideAllowedCodeRule(["legacy"]),
    ],
  );
}
