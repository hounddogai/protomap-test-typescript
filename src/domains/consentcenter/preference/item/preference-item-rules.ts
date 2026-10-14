import { PreferenceItem } from "./preference-item.js";

/** A rule a preference item must pass. Check returns its problems, or none. */
export interface PreferenceItemRule {
  check(item: PreferenceItem): string[];
}

export class PreferenceItemSegmentLengthRule implements PreferenceItemRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceItem): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceItemCodeLengthRule implements PreferenceItemRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceItem): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceItemCodePrefixRule implements PreferenceItemRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PreferenceItem): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a preference item. */
export class PreferenceItemValidator {
  rules: PreferenceItemRule[];

  constructor(rules: PreferenceItemRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceItem): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PreferenceItem): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceItem[]): Map<string, string[]> {
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

export function defaultPreferenceItemValidator(): PreferenceItemValidator {
  return new PreferenceItemValidator(
    [
      new PreferenceItemSegmentLengthRule(80),
      new PreferenceItemCodeLengthRule(86400),
      new PreferenceItemCodePrefixRule("ACM"),
    ],
  );
}
