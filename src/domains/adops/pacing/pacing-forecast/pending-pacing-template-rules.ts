import * as text from "../../../../kit/text.js";
import { PendingPacingTemplate } from "./pending-pacing-template.js";

/** A rule a pending pacing template must pass. Check returns its problems, or none. */
export interface PendingPacingTemplateRule {
  check(item: PendingPacingTemplate): string[];
}

export class PendingPacingTemplateRequiredCategoryRule implements PendingPacingTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPacingTemplate): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class PendingPacingTemplateAllowedChecksumRule implements PendingPacingTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingPacingTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is out of range`];
    return [];
  }
}

export class PendingPacingTemplateSourceLengthRule implements PendingPacingTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPacingTemplate): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPacingTemplateRequiredCodeRule implements PendingPacingTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPacingTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending pacing template. */
export class PendingPacingTemplateValidator {
  rules: PendingPacingTemplateRule[];

  constructor(rules: PendingPacingTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: PendingPacingTemplate): string[] {
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

  requireValid(item: PendingPacingTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingPacingTemplate[]): Map<string, string[]> {
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

export function defaultPendingPacingTemplateValidator(): PendingPacingTemplateValidator {
  return new PendingPacingTemplateValidator(
    [
      new PendingPacingTemplateRequiredCategoryRule("pending pacing template needs an entry"),
      new PendingPacingTemplateAllowedChecksumRule(["legacy", "legacy"]),
      new PendingPacingTemplateSourceLengthRule(64),
      new PendingPacingTemplateRequiredCodeRule("pending pacing template needs this field"),
    ],
  );
}
