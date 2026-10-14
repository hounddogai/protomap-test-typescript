import { DefaultBounceException } from "./default-bounce-exception.js";

/** A rule a default bounce exception must pass. Check returns its problems, or none. */
export interface DefaultBounceExceptionRule {
  check(item: DefaultBounceException): string[];
}

export class DefaultBounceExceptionRequiredCodeRule implements DefaultBounceExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultBounceException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultBounceExceptionCodePrefixRule implements DefaultBounceExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultBounceException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultBounceExceptionVariantLengthRule implements DefaultBounceExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultBounceException): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultBounceExceptionArchivedGuardRule implements DefaultBounceExceptionRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DefaultBounceException): string[] {
    if (item.archived && item.conversionRate > this.limit) return [`conversion rate ${item.conversionRate} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a default bounce exception. */
export class DefaultBounceExceptionValidator {
  rules: DefaultBounceExceptionRule[];

  constructor(rules: DefaultBounceExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultBounceException): string[] {
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

  requireValid(item: DefaultBounceException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultBounceException[]): Map<string, string[]> {
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

export function defaultDefaultBounceExceptionValidator(): DefaultBounceExceptionValidator {
  return new DefaultBounceExceptionValidator(
    [
      new DefaultBounceExceptionRequiredCodeRule("default bounce exception needs a value"),
      new DefaultBounceExceptionCodePrefixRule("OPS"),
      new DefaultBounceExceptionVariantLengthRule(1000),
      new DefaultBounceExceptionArchivedGuardRule(7.2),
    ],
  );
}
