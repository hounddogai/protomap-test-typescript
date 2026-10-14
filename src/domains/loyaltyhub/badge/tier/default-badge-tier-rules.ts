import { DefaultBadgeTier } from "./default-badge-tier.js";

/** A rule a default badge tier must pass. Check returns its problems, or none. */
export interface DefaultBadgeTierRule {
  check(item: DefaultBadgeTier): string[];
}

export class DefaultBadgeTierRequiredPhoneRule implements DefaultBadgeTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultBadgeTier): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultBadgeTierRequiredChannelRule implements DefaultBadgeTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultBadgeTier): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultBadgeTierCodeLengthRule implements DefaultBadgeTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultBadgeTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultBadgeTierRequiredCodeRule implements DefaultBadgeTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultBadgeTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default badge tier. */
export class DefaultBadgeTierValidator {
  rules: DefaultBadgeTierRule[];

  constructor(rules: DefaultBadgeTierRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultBadgeTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultBadgeTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultBadgeTier[]): Map<string, string[]> {
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

export function defaultDefaultBadgeTierValidator(): DefaultBadgeTierValidator {
  return new DefaultBadgeTierValidator(
    [
      new DefaultBadgeTierRequiredPhoneRule("default badge tier needs this field"),
      new DefaultBadgeTierRequiredChannelRule("default badge tier needs a value"),
      new DefaultBadgeTierCodeLengthRule(32),
      new DefaultBadgeTierRequiredCodeRule("default badge tier needs a value"),
    ],
  );
}
