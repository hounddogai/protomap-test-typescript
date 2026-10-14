import * as text from "../../../../kit/text.js";
import { ScheduledDomainRequest } from "./scheduled-domain-request.js";

/** A rule a scheduled domain request must pass. Check returns its problems, or none. */
export interface ScheduledDomainRequestRule {
  check(item: ScheduledDomainRequest): string[];
}

export class ScheduledDomainRequestCodeLengthRule implements ScheduledDomainRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDomainRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledDomainRequestAllowedNameRule implements ScheduledDomainRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledDomainRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is not allowed`];
    return [];
  }
}

export class ScheduledDomainRequestRequiredSourceRule implements ScheduledDomainRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDomainRequest): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledDomainRequestRequiredCodeRule implements ScheduledDomainRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDomainRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledDomainRequestSourceLengthRule implements ScheduledDomainRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDomainRequest): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledDomainRequestRequiredReviewerRule implements ScheduledDomainRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDomainRequest): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled domain request. */
export class ScheduledDomainRequestValidator {
  rules: ScheduledDomainRequestRule[];

  constructor(rules: ScheduledDomainRequestRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledDomainRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledDomainRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledDomainRequest[]): Map<string, string[]> {
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

export function defaultScheduledDomainRequestValidator(): ScheduledDomainRequestValidator {
  return new ScheduledDomainRequestValidator(
    [
      new ScheduledDomainRequestCodeLengthRule(32),
      new ScheduledDomainRequestAllowedNameRule(["rolling", "primary", "pending"]),
      new ScheduledDomainRequestRequiredSourceRule("scheduled domain request needs a value"),
      new ScheduledDomainRequestRequiredCodeRule("scheduled domain request needs an entry"),
      new ScheduledDomainRequestSourceLengthRule(86400),
      new ScheduledDomainRequestRequiredReviewerRule("scheduled domain request needs a value"),
    ],
  );
}
