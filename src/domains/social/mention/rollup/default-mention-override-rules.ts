import * as text from "../../../../kit/text.js";
import { DefaultMentionOverride } from "./default-mention-override.js";

/** A rule a default mention override must pass. Check returns its problems, or none. */
export interface DefaultMentionOverrideRule {
  check(item: DefaultMentionOverride): string[];
}

export class DefaultMentionOverrideRequiredCodeRule implements DefaultMentionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultMentionOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultMentionOverrideRequiredCategoryRule implements DefaultMentionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultMentionOverride): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultMentionOverrideAllowedCategoryRule implements DefaultMentionOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultMentionOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is duplicated`];
    return [];
  }
}

export class DefaultMentionOverrideRequiredLabelRule implements DefaultMentionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultMentionOverride): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default mention override. */
export class DefaultMentionOverrideValidator {
  rules: DefaultMentionOverrideRule[];

  constructor(rules: DefaultMentionOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultMentionOverride): string[] {
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

  requireValid(item: DefaultMentionOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultMentionOverride[]): Map<string, string[]> {
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

export function defaultDefaultMentionOverrideValidator(): DefaultMentionOverrideValidator {
  return new DefaultMentionOverrideValidator(
    [
      new DefaultMentionOverrideRequiredCodeRule("default mention override needs this field"),
      new DefaultMentionOverrideRequiredCategoryRule("default mention override needs a value"),
      new DefaultMentionOverrideAllowedCategoryRule([]),
      new DefaultMentionOverrideRequiredLabelRule("default mention override needs an entry"),
    ],
  );
}
