import { DefaultWarmupAssignment } from "./default-warmup-assignment.js";

/** A rule a default warmup assignment must pass. Check returns its problems, or none. */
export interface DefaultWarmupAssignmentRule {
  check(item: DefaultWarmupAssignment): string[];
}

export class DefaultWarmupAssignmentRequiredCodeRule implements DefaultWarmupAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultWarmupAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultWarmupAssignmentCodePrefixRule implements DefaultWarmupAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultWarmupAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultWarmupAssignmentRequiredTitleRule implements DefaultWarmupAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultWarmupAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultWarmupAssignmentJourneyIdLengthRule implements DefaultWarmupAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultWarmupAssignment): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default warmup assignment. */
export class DefaultWarmupAssignmentValidator {
  rules: DefaultWarmupAssignmentRule[];

  constructor(rules: DefaultWarmupAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultWarmupAssignment): string[] {
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

  requireValid(item: DefaultWarmupAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultWarmupAssignment[]): Map<string, string[]> {
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

export function defaultDefaultWarmupAssignmentValidator(): DefaultWarmupAssignmentValidator {
  return new DefaultWarmupAssignmentValidator(
    [
      new DefaultWarmupAssignmentRequiredCodeRule("default warmup assignment needs an entry"),
      new DefaultWarmupAssignmentCodePrefixRule("X"),
      new DefaultWarmupAssignmentRequiredTitleRule("default warmup assignment needs a value"),
      new DefaultWarmupAssignmentJourneyIdLengthRule(120),
    ],
  );
}
