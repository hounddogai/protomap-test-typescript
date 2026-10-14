import { SenderPreference } from "./sender-preference.js";

/** A rule a sender preference must pass. Check returns its problems, or none. */
export interface SenderPreferenceRule {
  check(item: SenderPreference): string[];
}

export class SenderPreferenceRequiredSourceRule implements SenderPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderPreference): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class SenderPreferenceChannelLengthRule implements SenderPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderPreference): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderPreferenceCodePrefixRule implements SenderPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SenderPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SenderPreferenceNameLengthRule implements SenderPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderPreference): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderPreferenceRequiredNameRule implements SenderPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderPreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a sender preference. */
export class SenderPreferenceValidator {
  rules: SenderPreferenceRule[];

  constructor(rules: SenderPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: SenderPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderPreference[]): Map<string, string[]> {
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

export function defaultSenderPreferenceValidator(): SenderPreferenceValidator {
  return new SenderPreferenceValidator(
    [
      new SenderPreferenceRequiredSourceRule("sender preference needs a value"),
      new SenderPreferenceChannelLengthRule(255),
      new SenderPreferenceCodePrefixRule("ACM"),
      new SenderPreferenceNameLengthRule(120),
      new SenderPreferenceRequiredNameRule("sender preference needs a value"),
    ],
  );
}
