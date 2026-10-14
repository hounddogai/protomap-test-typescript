import * as text from "../../../../kit/text.js";
import { CsatThreshold } from "./csat-threshold.js";

/** A rule a csat threshold must pass. Check returns its problems, or none. */
export interface CsatThresholdRule {
  check(item: CsatThreshold): string[];
}

export class CsatThresholdCodePrefixRule implements CsatThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CsatThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CsatThresholdRequiredCodeRule implements CsatThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CsatThresholdAllowedPhoneRule implements CsatThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CsatThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is not allowed`];
    return [];
  }
}

export class CsatThresholdRequiredContactEmailRule implements CsatThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatThreshold): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a csat threshold. */
export class CsatThresholdValidator {
  rules: CsatThresholdRule[];

  constructor(rules: CsatThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: CsatThreshold): string[] {
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

  requireValid(item: CsatThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatThreshold[]): Map<string, string[]> {
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

export function defaultCsatThresholdValidator(): CsatThresholdValidator {
  return new CsatThresholdValidator(
    [
      new CsatThresholdCodePrefixRule("ACM"),
      new CsatThresholdRequiredCodeRule("csat threshold needs a value"),
      new CsatThresholdAllowedPhoneRule(["pending", "weighted", "seasonal"]),
      new CsatThresholdRequiredContactEmailRule("csat threshold needs this field"),
    ],
  );
}
