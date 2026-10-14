import { ActivationDraft } from "./activation-draft.js";

/** A rule a activation draft must pass. Check returns its problems, or none. */
export interface ActivationDraftRule {
  check(item: ActivationDraft): string[];
}

export class ActivationDraftNameLengthRule implements ActivationDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationDraft): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationDraftCodePrefixRule implements ActivationDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ActivationDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ActivationDraftContactEmailLengthRule implements ActivationDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationDraft): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a activation draft. */
export class ActivationDraftValidator {
  rules: ActivationDraftRule[];

  constructor(rules: ActivationDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationDraft): string[] {
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

  requireValid(item: ActivationDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationDraft[]): Map<string, string[]> {
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

export function defaultActivationDraftValidator(): ActivationDraftValidator {
  return new ActivationDraftValidator(
    [
      new ActivationDraftNameLengthRule(80),
      new ActivationDraftCodePrefixRule("ACM"),
      new ActivationDraftContactEmailLengthRule(32),
    ],
  );
}
