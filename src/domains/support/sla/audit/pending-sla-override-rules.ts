import * as text from "../../../../kit/text.js";
import { PendingSlaOverride } from "./pending-sla-override.js";

/** A rule a pending sla override must pass. Check returns its problems, or none. */
export interface PendingSlaOverrideRule {
  check(item: PendingSlaOverride): string[];
}

export class PendingSlaOverrideCodeLengthRule implements PendingSlaOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSlaOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingSlaOverrideCategoryLengthRule implements PendingSlaOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSlaOverride): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingSlaOverrideAudienceIdLengthRule implements PendingSlaOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSlaOverride): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingSlaOverrideRequiredCodeRule implements PendingSlaOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSlaOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSlaOverrideRequiredCategoryRule implements PendingSlaOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSlaOverride): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSlaOverrideAllowedCodeRule implements PendingSlaOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingSlaOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

/** Runs every rule of a pending sla override. */
export class PendingSlaOverrideValidator {
  rules: PendingSlaOverrideRule[];

  constructor(rules: PendingSlaOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: PendingSlaOverride): string[] {
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

  requireValid(item: PendingSlaOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingSlaOverride[]): Map<string, string[]> {
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

export function defaultPendingSlaOverrideValidator(): PendingSlaOverrideValidator {
  return new PendingSlaOverrideValidator(
    [
      new PendingSlaOverrideCodeLengthRule(255),
      new PendingSlaOverrideCategoryLengthRule(80),
      new PendingSlaOverrideAudienceIdLengthRule(1000),
      new PendingSlaOverrideRequiredCodeRule("pending sla override needs an entry"),
      new PendingSlaOverrideRequiredCategoryRule("pending sla override needs an entry"),
      new PendingSlaOverrideAllowedCodeRule(["pending", "adaptive", "capped"]),
    ],
  );
}
