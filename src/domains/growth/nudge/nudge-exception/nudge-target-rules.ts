import { NudgeTarget } from "./nudge-target.js";

/** A rule a nudge target must pass. Check returns its problems, or none. */
export interface NudgeTargetRule {
  check(item: NudgeTarget): string[];
}

export class NudgeTargetCodePrefixRule implements NudgeTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: NudgeTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class NudgeTargetTitleLengthRule implements NudgeTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeTarget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeTargetRequiredOwnerIdRule implements NudgeTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeTarget): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeTargetCodeLengthRule implements NudgeTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a nudge target. */
export class NudgeTargetValidator {
  rules: NudgeTargetRule[];

  constructor(rules: NudgeTargetRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeTarget): string[] {
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

  requireValid(item: NudgeTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeTarget[]): Map<string, string[]> {
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

export function defaultNudgeTargetValidator(): NudgeTargetValidator {
  return new NudgeTargetValidator(
    [
      new NudgeTargetCodePrefixRule("ACM"),
      new NudgeTargetTitleLengthRule(16),
      new NudgeTargetRequiredOwnerIdRule("nudge target needs this field"),
      new NudgeTargetCodeLengthRule(1000),
    ],
  );
}
