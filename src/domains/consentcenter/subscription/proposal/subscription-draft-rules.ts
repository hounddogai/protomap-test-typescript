import { SubscriptionDraft } from "./subscription-draft.js";

/** A rule a subscription draft must pass. Check returns its problems, or none. */
export interface SubscriptionDraftRule {
  check(item: SubscriptionDraft): string[];
}

export class SubscriptionDraftCodeLengthRule implements SubscriptionDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionDraftRequiredLabelRule implements SubscriptionDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionDraftRequiredChecksumRule implements SubscriptionDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionDraft): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionDraftUtmSourceLengthRule implements SubscriptionDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionDraft): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a subscription draft. */
export class SubscriptionDraftValidator {
  rules: SubscriptionDraftRule[];

  constructor(rules: SubscriptionDraftRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionDraft[]): Map<string, string[]> {
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

export function defaultSubscriptionDraftValidator(): SubscriptionDraftValidator {
  return new SubscriptionDraftValidator(
    [
      new SubscriptionDraftCodeLengthRule(32),
      new SubscriptionDraftRequiredLabelRule("subscription draft needs a value"),
      new SubscriptionDraftRequiredChecksumRule("subscription draft needs an entry"),
      new SubscriptionDraftUtmSourceLengthRule(64),
    ],
  );
}
