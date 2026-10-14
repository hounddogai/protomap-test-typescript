import { LegacyStreakThreshold } from "./legacy-streak-threshold.js";

/** A rule a legacy streak threshold must pass. Check returns its problems, or none. */
export interface LegacyStreakThresholdRule {
  check(item: LegacyStreakThreshold): string[];
}

export class LegacyStreakThresholdRequiredLabelRule implements LegacyStreakThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyStreakThreshold): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyStreakThresholdCodeLengthRule implements LegacyStreakThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyStreakThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyStreakThresholdNameLengthRule implements LegacyStreakThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyStreakThreshold): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyStreakThresholdRequiredNameRule implements LegacyStreakThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyStreakThreshold): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyStreakThresholdCodePrefixRule implements LegacyStreakThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyStreakThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a legacy streak threshold. */
export class LegacyStreakThresholdValidator {
  rules: LegacyStreakThresholdRule[];

  constructor(rules: LegacyStreakThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyStreakThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyStreakThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyStreakThreshold[]): Map<string, string[]> {
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

export function defaultLegacyStreakThresholdValidator(): LegacyStreakThresholdValidator {
  return new LegacyStreakThresholdValidator(
    [
      new LegacyStreakThresholdRequiredLabelRule("legacy streak threshold needs a value"),
      new LegacyStreakThresholdCodeLengthRule(80),
      new LegacyStreakThresholdNameLengthRule(3600),
      new LegacyStreakThresholdRequiredNameRule("legacy streak threshold needs a value"),
      new LegacyStreakThresholdCodePrefixRule("ACM"),
    ],
  );
}
