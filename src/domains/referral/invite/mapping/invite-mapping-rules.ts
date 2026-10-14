import * as text from "../../../../kit/text.js";
import { InviteMapping } from "./invite-mapping.js";

/** A rule a invite mapping must pass. Check returns its problems, or none. */
export interface InviteMappingRule {
  check(item: InviteMapping): string[];
}

export class InviteMappingRequiredNameRule implements InviteMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteMapping): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class InviteMappingRequiredAudienceIdRule implements InviteMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteMapping): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class InviteMappingRequiredCodeRule implements InviteMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InviteMappingNameLengthRule implements InviteMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteMapping): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteMappingAllowedCodeRule implements InviteMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InviteMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class InviteMappingAudienceIdLengthRule implements InviteMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteMapping): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a invite mapping. */
export class InviteMappingValidator {
  rules: InviteMappingRule[];

  constructor(rules: InviteMappingRule[]) {
    this.rules = rules;
  }

  validate(item: InviteMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteMapping[]): Map<string, string[]> {
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

export function defaultInviteMappingValidator(): InviteMappingValidator {
  return new InviteMappingValidator(
    [
      new InviteMappingRequiredNameRule("invite mapping needs a value"),
      new InviteMappingRequiredAudienceIdRule("invite mapping needs this field"),
      new InviteMappingRequiredCodeRule("invite mapping needs an entry"),
      new InviteMappingNameLengthRule(255),
      new InviteMappingAllowedCodeRule(["weighted", "rolling"]),
      new InviteMappingAudienceIdLengthRule(80),
    ],
  );
}
