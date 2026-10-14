import * as text from "../../../../kit/text.js";
import { DefaultMentionMapping } from "./default-mention-mapping.js";

/** A rule a default mention mapping must pass. Check returns its problems, or none. */
export interface DefaultMentionMappingRule {
  check(item: DefaultMentionMapping): string[];
}

export class DefaultMentionMappingLabelLengthRule implements DefaultMentionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultMentionMapping): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultMentionMappingRequiredLabelRule implements DefaultMentionMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultMentionMapping): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultMentionMappingCodeLengthRule implements DefaultMentionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultMentionMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultMentionMappingCodePrefixRule implements DefaultMentionMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultMentionMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultMentionMappingRequiredOwnerIdRule implements DefaultMentionMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultMentionMapping): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultMentionMappingAllowedLabelRule implements DefaultMentionMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultMentionMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is above maximum`];
    return [];
  }
}

/** Runs every rule of a default mention mapping. */
export class DefaultMentionMappingValidator {
  rules: DefaultMentionMappingRule[];

  constructor(rules: DefaultMentionMappingRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultMentionMapping): string[] {
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

  requireValid(item: DefaultMentionMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultMentionMapping[]): Map<string, string[]> {
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

export function defaultDefaultMentionMappingValidator(): DefaultMentionMappingValidator {
  return new DefaultMentionMappingValidator(
    [
      new DefaultMentionMappingLabelLengthRule(255),
      new DefaultMentionMappingRequiredLabelRule("default mention mapping needs this field"),
      new DefaultMentionMappingCodeLengthRule(32),
      new DefaultMentionMappingCodePrefixRule("X"),
      new DefaultMentionMappingRequiredOwnerIdRule("default mention mapping needs an entry"),
      new DefaultMentionMappingAllowedLabelRule(["adaptive", "legacy"]),
    ],
  );
}
