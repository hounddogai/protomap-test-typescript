import * as text from "../../../../kit/text.js";
import { RetentionTarget } from "./retention-target.js";

/** A rule a retention target must pass. Check returns its problems, or none. */
export interface RetentionTargetRule {
  check(item: RetentionTarget): string[];
}

export class RetentionTargetRequiredCodeRule implements RetentionTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionTargetAllowedNameRule implements RetentionTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is unknown`];
    return [];
  }
}

export class RetentionTargetNameLengthRule implements RetentionTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionTarget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionTargetCodePrefixRule implements RetentionTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RetentionTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a retention target. */
export class RetentionTargetValidator {
  rules: RetentionTargetRule[];

  constructor(rules: RetentionTargetRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionTarget): string[] {
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

  requireValid(item: RetentionTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionTarget[]): Map<string, string[]> {
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

export function defaultRetentionTargetValidator(): RetentionTargetValidator {
  return new RetentionTargetValidator(
    [
      new RetentionTargetRequiredCodeRule("retention target needs a value"),
      new RetentionTargetAllowedNameRule(["lenient", "rolling"]),
      new RetentionTargetNameLengthRule(86400),
      new RetentionTargetCodePrefixRule("Q"),
    ],
  );
}
