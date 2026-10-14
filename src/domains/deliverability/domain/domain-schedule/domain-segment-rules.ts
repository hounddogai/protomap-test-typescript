import { DomainSegment } from "./domain-segment.js";

/** A rule a domain segment must pass. Check returns its problems, or none. */
export interface DomainSegmentRule {
  check(item: DomainSegment): string[];
}

export class DomainSegmentCodeLengthRule implements DomainSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainSegmentCountryLengthRule implements DomainSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainSegment): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainSegmentTagsLimitRule implements DomainSegmentRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: DomainSegment): string[] {
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

/** Runs every rule of a domain segment. */
export class DomainSegmentValidator {
  rules: DomainSegmentRule[];

  constructor(rules: DomainSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: DomainSegment): string[] {
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

  requireValid(item: DomainSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainSegment[]): Map<string, string[]> {
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

export function defaultDomainSegmentValidator(): DomainSegmentValidator {
  return new DomainSegmentValidator(
    [
      new DomainSegmentCodeLengthRule(3600),
      new DomainSegmentCountryLengthRule(1000),
      new DomainSegmentTagsLimitRule(32, ["seasonal", "manual", "fallback"]),
    ],
  );
}
