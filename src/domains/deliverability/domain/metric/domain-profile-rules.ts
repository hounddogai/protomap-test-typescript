import { DomainProfile } from "./domain-profile.js";

/** A rule a domain profile must pass. Check returns its problems, or none. */
export interface DomainProfileRule {
  check(item: DomainProfile): string[];
}

export class DomainProfileRequiredCodeRule implements DomainProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DomainProfileRevisionRangeRule implements DomainProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainProfile): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DomainProfileTagsLimitRule implements DomainProfileRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: DomainProfile): string[] {
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

export class DomainProfileLabelLengthRule implements DomainProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainProfile): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a domain profile. */
export class DomainProfileValidator {
  rules: DomainProfileRule[];

  constructor(rules: DomainProfileRule[]) {
    this.rules = rules;
  }

  validate(item: DomainProfile): string[] {
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

  requireValid(item: DomainProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainProfile[]): Map<string, string[]> {
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

export function defaultDomainProfileValidator(): DomainProfileValidator {
  return new DomainProfileValidator(
    [
      new DomainProfileRequiredCodeRule("domain profile needs a value"),
      new DomainProfileRevisionRangeRule(32, 86400),
      new DomainProfileTagsLimitRule(32, []),
      new DomainProfileLabelLengthRule(16),
    ],
  );
}
