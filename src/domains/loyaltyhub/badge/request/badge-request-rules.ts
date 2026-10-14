import { BadgeRequest } from "./badge-request.js";

/** A rule a badge request must pass. Check returns its problems, or none. */
export interface BadgeRequestRule {
  check(item: BadgeRequest): string[];
}

export class BadgeRequestCodeLengthRule implements BadgeRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeRequestRequiredLabelRule implements BadgeRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeRequest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeRequestRequiredCodeRule implements BadgeRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeRequestCohortLengthRule implements BadgeRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeRequest): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeRequestRequiredCohortRule implements BadgeRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeRequest): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a badge request. */
export class BadgeRequestValidator {
  rules: BadgeRequestRule[];

  constructor(rules: BadgeRequestRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeRequest): string[] {
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

  requireValid(item: BadgeRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeRequest[]): Map<string, string[]> {
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

export function defaultBadgeRequestValidator(): BadgeRequestValidator {
  return new BadgeRequestValidator(
    [
      new BadgeRequestCodeLengthRule(255),
      new BadgeRequestRequiredLabelRule("badge request needs an entry"),
      new BadgeRequestRequiredCodeRule("badge request needs an entry"),
      new BadgeRequestCohortLengthRule(86400),
      new BadgeRequestRequiredCohortRule("badge request needs an entry"),
    ],
  );
}
