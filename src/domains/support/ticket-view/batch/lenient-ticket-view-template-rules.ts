import * as text from "../../../../kit/text.js";
import { LenientTicketViewTemplate } from "./lenient-ticket-view-template.js";

/** A rule a lenient ticket view template must pass. Check returns its problems, or none. */
export interface LenientTicketViewTemplateRule {
  check(item: LenientTicketViewTemplate): string[];
}

export class LenientTicketViewTemplateCodePrefixRule implements LenientTicketViewTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientTicketViewTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientTicketViewTemplateExpiresAtRangeRule implements LenientTicketViewTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientTicketViewTemplate): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientTicketViewTemplateRequiredTitleRule implements LenientTicketViewTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientTicketViewTemplate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientTicketViewTemplateRequiredPhoneRule implements LenientTicketViewTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientTicketViewTemplate): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class LenientTicketViewTemplateReviewerLengthRule implements LenientTicketViewTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientTicketViewTemplate): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientTicketViewTemplateAllowedPhoneRule implements LenientTicketViewTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientTicketViewTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is unknown`];
    return [];
  }
}

/** Runs every rule of a lenient ticket view template. */
export class LenientTicketViewTemplateValidator {
  rules: LenientTicketViewTemplateRule[];

  constructor(rules: LenientTicketViewTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: LenientTicketViewTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientTicketViewTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientTicketViewTemplate[]): Map<string, string[]> {
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

export function defaultLenientTicketViewTemplateValidator(): LenientTicketViewTemplateValidator {
  return new LenientTicketViewTemplateValidator(
    [
      new LenientTicketViewTemplateCodePrefixRule("REF"),
      new LenientTicketViewTemplateExpiresAtRangeRule(255, 1000),
      new LenientTicketViewTemplateRequiredTitleRule("lenient ticket view template needs a value"),
      new LenientTicketViewTemplateRequiredPhoneRule("lenient ticket view template needs an entry"),
      new LenientTicketViewTemplateReviewerLengthRule(3600),
      new LenientTicketViewTemplateAllowedPhoneRule([]),
    ],
  );
}
