import { FallbackInvitePreference } from "./fallback-invite-preference.js";

/** A rule a fallback invite preference must pass. Check returns its problems, or none. */
export interface FallbackInvitePreferenceRule {
  check(item: FallbackInvitePreference): string[];
}

export class FallbackInvitePreferenceRequiredTitleRule implements FallbackInvitePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackInvitePreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackInvitePreferenceRequiredTimezoneRule implements FallbackInvitePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackInvitePreference): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackInvitePreferenceCodeLengthRule implements FallbackInvitePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackInvitePreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackInvitePreferenceApprovedGuardRule implements FallbackInvitePreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackInvitePreference): string[] {
    if (item.approved && item.capacity > this.limit) return [`capacity ${item.capacity} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class FallbackInvitePreferenceCodePrefixRule implements FallbackInvitePreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackInvitePreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackInvitePreferenceRequiredCodeRule implements FallbackInvitePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackInvitePreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback invite preference. */
export class FallbackInvitePreferenceValidator {
  rules: FallbackInvitePreferenceRule[];

  constructor(rules: FallbackInvitePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackInvitePreference): string[] {
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

  requireValid(item: FallbackInvitePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackInvitePreference[]): Map<string, string[]> {
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

export function defaultFallbackInvitePreferenceValidator(): FallbackInvitePreferenceValidator {
  return new FallbackInvitePreferenceValidator(
    [
      new FallbackInvitePreferenceRequiredTitleRule("fallback invite preference needs this field"),
      new FallbackInvitePreferenceRequiredTimezoneRule("fallback invite preference needs this field"),
      new FallbackInvitePreferenceCodeLengthRule(1000),
      new FallbackInvitePreferenceApprovedGuardRule(120),
      new FallbackInvitePreferenceCodePrefixRule("REF"),
      new FallbackInvitePreferenceRequiredCodeRule("fallback invite preference needs this field"),
    ],
  );
}
