import { LenientPreferenceWindow } from "./lenient-preference-window.js";

/** A rule a lenient preference window must pass. Check returns its problems, or none. */
export interface LenientPreferenceWindowRule {
  check(item: LenientPreferenceWindow): string[];
}

export class LenientPreferenceWindowTitleLengthRule implements LenientPreferenceWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPreferenceWindow): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPreferenceWindowRequiredLabelRule implements LenientPreferenceWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPreferenceWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPreferenceWindowRequiredUtmSourceRule implements LenientPreferenceWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPreferenceWindow): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPreferenceWindowCodePrefixRule implements LenientPreferenceWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientPreferenceWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a lenient preference window. */
export class LenientPreferenceWindowValidator {
  rules: LenientPreferenceWindowRule[];

  constructor(rules: LenientPreferenceWindowRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPreferenceWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientPreferenceWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPreferenceWindow[]): Map<string, string[]> {
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

export function defaultLenientPreferenceWindowValidator(): LenientPreferenceWindowValidator {
  return new LenientPreferenceWindowValidator(
    [
      new LenientPreferenceWindowTitleLengthRule(80),
      new LenientPreferenceWindowRequiredLabelRule("lenient preference window needs a value"),
      new LenientPreferenceWindowRequiredUtmSourceRule("lenient preference window needs this field"),
      new LenientPreferenceWindowCodePrefixRule("ACM"),
    ],
  );
}
