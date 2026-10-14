import { CsatRequest } from "./csat-request.js";

/** A rule a csat request must pass. Check returns its problems, or none. */
export interface CsatRequestRule {
  check(item: CsatRequest): string[];
}

export class CsatRequestCodePrefixRule implements CsatRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CsatRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CsatRequestContactEmailLengthRule implements CsatRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatRequest): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatRequestArchivedGuardRule implements CsatRequestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CsatRequest): string[] {
    if (item.archived && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class CsatRequestLabelLengthRule implements CsatRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatRequest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a csat request. */
export class CsatRequestValidator {
  rules: CsatRequestRule[];

  constructor(rules: CsatRequestRule[]) {
    this.rules = rules;
  }

  validate(item: CsatRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatRequest[]): Map<string, string[]> {
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

export function defaultCsatRequestValidator(): CsatRequestValidator {
  return new CsatRequestValidator(
    [
      new CsatRequestCodePrefixRule("REF"),
      new CsatRequestContactEmailLengthRule(32),
      new CsatRequestArchivedGuardRule(64),
      new CsatRequestLabelLengthRule(16),
    ],
  );
}
