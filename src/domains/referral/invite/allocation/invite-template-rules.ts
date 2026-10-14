import * as text from "../../../../kit/text.js";
import { InviteTemplate } from "./invite-template.js";

/** A rule a invite template must pass. Check returns its problems, or none. */
export interface InviteTemplateRule {
  check(item: InviteTemplate): string[];
}

export class InviteTemplateCodePrefixRule implements InviteTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InviteTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InviteTemplateLabelLengthRule implements InviteTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteTemplate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteTemplateRequiredLocaleRule implements InviteTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteTemplate): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class InviteTemplateAllowedLabelRule implements InviteTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InviteTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is missing`];
    return [];
  }
}

export class InviteTemplateLocaleLengthRule implements InviteTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteTemplate): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteTemplateRequiredUnitRule implements InviteTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteTemplate): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a invite template. */
export class InviteTemplateValidator {
  rules: InviteTemplateRule[];

  constructor(rules: InviteTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: InviteTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteTemplate[]): Map<string, string[]> {
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

export function defaultInviteTemplateValidator(): InviteTemplateValidator {
  return new InviteTemplateValidator(
    [
      new InviteTemplateCodePrefixRule("X"),
      new InviteTemplateLabelLengthRule(32),
      new InviteTemplateRequiredLocaleRule("invite template needs a value"),
      new InviteTemplateAllowedLabelRule(["primary"]),
      new InviteTemplateLocaleLengthRule(16),
      new InviteTemplateRequiredUnitRule("invite template needs an entry"),
    ],
  );
}
