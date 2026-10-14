import { DoubleOptInOverride } from "./double-opt-in-override.js";

/** A rule a double opt in override must pass. Check returns its problems, or none. */
export interface DoubleOptInOverrideRule {
  check(item: DoubleOptInOverride): string[];
}

export class DoubleOptInOverrideCodePrefixRule implements DoubleOptInOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DoubleOptInOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DoubleOptInOverrideAudienceIdLengthRule implements DoubleOptInOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInOverride): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInOverrideRequiredAudienceIdRule implements DoubleOptInOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInOverride): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a double opt in override. */
export class DoubleOptInOverrideValidator {
  rules: DoubleOptInOverrideRule[];

  constructor(rules: DoubleOptInOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInOverride[]): Map<string, string[]> {
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

export function defaultDoubleOptInOverrideValidator(): DoubleOptInOverrideValidator {
  return new DoubleOptInOverrideValidator(
    [
      new DoubleOptInOverrideCodePrefixRule("ACM"),
      new DoubleOptInOverrideAudienceIdLengthRule(3600),
      new DoubleOptInOverrideRequiredAudienceIdRule("double opt in override needs this field"),
    ],
  );
}
