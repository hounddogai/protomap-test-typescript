import { MentionPreference } from "./mention-preference.js";

/** A rule a mention preference must pass. Check returns its problems, or none. */
export interface MentionPreferenceRule {
  check(item: MentionPreference): string[];
}

export class MentionPreferenceRequiredNameRule implements MentionPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionPreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class MentionPreferenceNameLengthRule implements MentionPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionPreference): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionPreferenceCodePrefixRule implements MentionPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MentionPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MentionPreferencePhoneLengthRule implements MentionPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionPreference): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a mention preference. */
export class MentionPreferenceValidator {
  rules: MentionPreferenceRule[];

  constructor(rules: MentionPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: MentionPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionPreference[]): Map<string, string[]> {
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

export function defaultMentionPreferenceValidator(): MentionPreferenceValidator {
  return new MentionPreferenceValidator(
    [
      new MentionPreferenceRequiredNameRule("mention preference needs an entry"),
      new MentionPreferenceNameLengthRule(120),
      new MentionPreferenceCodePrefixRule("Q"),
      new MentionPreferencePhoneLengthRule(86400),
    ],
  );
}
