import { ScheduledDoubleOptInAgreement } from "./scheduled-double-opt-in-agreement.js";

/** A rule a scheduled double opt in agreement must pass. Check returns its problems, or none. */
export interface ScheduledDoubleOptInAgreementRule {
  check(item: ScheduledDoubleOptInAgreement): string[];
}

export class ScheduledDoubleOptInAgreementRequiredLabelRule implements ScheduledDoubleOptInAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDoubleOptInAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledDoubleOptInAgreementTagsLimitRule implements ScheduledDoubleOptInAgreementRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ScheduledDoubleOptInAgreement): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class ScheduledDoubleOptInAgreementSequenceRangeRule implements ScheduledDoubleOptInAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledDoubleOptInAgreement): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledDoubleOptInAgreementRequiredCodeRule implements ScheduledDoubleOptInAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDoubleOptInAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledDoubleOptInAgreementLabelLengthRule implements ScheduledDoubleOptInAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDoubleOptInAgreement): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledDoubleOptInAgreementWeightRangeRule implements ScheduledDoubleOptInAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledDoubleOptInAgreement): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a scheduled double opt in agreement. */
export class ScheduledDoubleOptInAgreementValidator {
  rules: ScheduledDoubleOptInAgreementRule[];

  constructor(rules: ScheduledDoubleOptInAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledDoubleOptInAgreement): string[] {
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

  requireValid(item: ScheduledDoubleOptInAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledDoubleOptInAgreement[]): Map<string, string[]> {
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

export function defaultScheduledDoubleOptInAgreementValidator(): ScheduledDoubleOptInAgreementValidator {
  return new ScheduledDoubleOptInAgreementValidator(
    [
      new ScheduledDoubleOptInAgreementRequiredLabelRule("scheduled double opt in agreement needs an entry"),
      new ScheduledDoubleOptInAgreementTagsLimitRule(80, ["adaptive", "rolling"]),
      new ScheduledDoubleOptInAgreementSequenceRangeRule(1000, 3600),
      new ScheduledDoubleOptInAgreementRequiredCodeRule("scheduled double opt in agreement needs this field"),
      new ScheduledDoubleOptInAgreementLabelLengthRule(80),
      new ScheduledDoubleOptInAgreementWeightRangeRule(4.5, 2383.3),
    ],
  );
}
