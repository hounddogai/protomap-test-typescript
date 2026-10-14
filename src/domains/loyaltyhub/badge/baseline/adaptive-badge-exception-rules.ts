import { AdaptiveBadgeException } from "./adaptive-badge-exception.js";

/** A rule a adaptive badge exception must pass. Check returns its problems, or none. */
export interface AdaptiveBadgeExceptionRule {
  check(item: AdaptiveBadgeException): string[];
}

export class AdaptiveBadgeExceptionCodePrefixRule implements AdaptiveBadgeExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveBadgeException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveBadgeExceptionUtmSourceLengthRule implements AdaptiveBadgeExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveBadgeException): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveBadgeExceptionCodeLengthRule implements AdaptiveBadgeExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveBadgeException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveBadgeExceptionNameLengthRule implements AdaptiveBadgeExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveBadgeException): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveBadgeExceptionRequiredNameRule implements AdaptiveBadgeExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveBadgeException): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveBadgeExceptionRequiredUtmSourceRule implements AdaptiveBadgeExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveBadgeException): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive badge exception. */
export class AdaptiveBadgeExceptionValidator {
  rules: AdaptiveBadgeExceptionRule[];

  constructor(rules: AdaptiveBadgeExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveBadgeException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveBadgeException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveBadgeException[]): Map<string, string[]> {
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

export function defaultAdaptiveBadgeExceptionValidator(): AdaptiveBadgeExceptionValidator {
  return new AdaptiveBadgeExceptionValidator(
    [
      new AdaptiveBadgeExceptionCodePrefixRule("ACM"),
      new AdaptiveBadgeExceptionUtmSourceLengthRule(32),
      new AdaptiveBadgeExceptionCodeLengthRule(1000),
      new AdaptiveBadgeExceptionNameLengthRule(16),
      new AdaptiveBadgeExceptionRequiredNameRule("adaptive badge exception needs an entry"),
      new AdaptiveBadgeExceptionRequiredUtmSourceRule("adaptive badge exception needs this field"),
    ],
  );
}
