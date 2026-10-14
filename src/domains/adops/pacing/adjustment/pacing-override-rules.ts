import { PacingOverride } from "./pacing-override.js";

/** A rule a pacing override must pass. Check returns its problems, or none. */
export interface PacingOverrideRule {
  check(item: PacingOverride): string[];
}

export class PacingOverrideEndsAtRangeRule implements PacingOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingOverride): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PacingOverrideVisibleGuardRule implements PacingOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PacingOverride): string[] {
    if (item.visible && item.cost > this.limit) return [`cost ${item.cost} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class PacingOverrideCodePrefixRule implements PacingOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PacingOverrideRequiredTitleRule implements PacingOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingOverride): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PacingOverrideRequiredCodeRule implements PacingOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pacing override. */
export class PacingOverrideValidator {
  rules: PacingOverrideRule[];

  constructor(rules: PacingOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: PacingOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PacingOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingOverride[]): Map<string, string[]> {
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

export function defaultPacingOverrideValidator(): PacingOverrideValidator {
  return new PacingOverrideValidator(
    [
      new PacingOverrideEndsAtRangeRule(1000, 86400),
      new PacingOverrideVisibleGuardRule(7.6),
      new PacingOverrideCodePrefixRule("Q"),
      new PacingOverrideRequiredTitleRule("pacing override needs this field"),
      new PacingOverrideRequiredCodeRule("pacing override needs a value"),
    ],
  );
}
