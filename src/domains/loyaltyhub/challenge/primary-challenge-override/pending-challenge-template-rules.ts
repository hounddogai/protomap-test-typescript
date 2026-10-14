import * as text from "../../../../kit/text.js";
import { PendingChallengeTemplate } from "./pending-challenge-template.js";

/** A rule a pending challenge template must pass. Check returns its problems, or none. */
export interface PendingChallengeTemplateRule {
  check(item: PendingChallengeTemplate): string[];
}

export class PendingChallengeTemplateRequiredSegmentRule implements PendingChallengeTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingChallengeTemplate): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class PendingChallengeTemplateOwnerIdLengthRule implements PendingChallengeTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingChallengeTemplate): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingChallengeTemplateAllowedCodeRule implements PendingChallengeTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingChallengeTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class PendingChallengeTemplateNameLengthRule implements PendingChallengeTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingChallengeTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingChallengeTemplateSegmentLengthRule implements PendingChallengeTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingChallengeTemplate): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingChallengeTemplateCodeLengthRule implements PendingChallengeTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingChallengeTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending challenge template. */
export class PendingChallengeTemplateValidator {
  rules: PendingChallengeTemplateRule[];

  constructor(rules: PendingChallengeTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: PendingChallengeTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingChallengeTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingChallengeTemplate[]): Map<string, string[]> {
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

export function defaultPendingChallengeTemplateValidator(): PendingChallengeTemplateValidator {
  return new PendingChallengeTemplateValidator(
    [
      new PendingChallengeTemplateRequiredSegmentRule("pending challenge template needs a value"),
      new PendingChallengeTemplateOwnerIdLengthRule(255),
      new PendingChallengeTemplateAllowedCodeRule(["global", "seasonal", "strict"]),
      new PendingChallengeTemplateNameLengthRule(64),
      new PendingChallengeTemplateSegmentLengthRule(80),
      new PendingChallengeTemplateCodeLengthRule(120),
    ],
  );
}
