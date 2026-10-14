import * as text from "../../../../kit/text.js";
import { AdaptiveExitRuleDraft } from "./adaptive-exit-rule-draft.js";

/** A rule a adaptive exit rule draft must pass. Check returns its problems, or none. */
export interface AdaptiveExitRuleDraftRule {
  check(item: AdaptiveExitRuleDraft): string[];
}

export class AdaptiveExitRuleDraftAllowedSourceRule implements AdaptiveExitRuleDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveExitRuleDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is expired`];
    return [];
  }
}

export class AdaptiveExitRuleDraftCodeLengthRule implements AdaptiveExitRuleDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveExitRuleDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveExitRuleDraftCodePrefixRule implements AdaptiveExitRuleDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveExitRuleDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a adaptive exit rule draft. */
export class AdaptiveExitRuleDraftValidator {
  rules: AdaptiveExitRuleDraftRule[];

  constructor(rules: AdaptiveExitRuleDraftRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveExitRuleDraft): string[] {
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

  requireValid(item: AdaptiveExitRuleDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveExitRuleDraft[]): Map<string, string[]> {
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

export function defaultAdaptiveExitRuleDraftValidator(): AdaptiveExitRuleDraftValidator {
  return new AdaptiveExitRuleDraftValidator(
    [
      new AdaptiveExitRuleDraftAllowedSourceRule(["capped"]),
      new AdaptiveExitRuleDraftCodeLengthRule(86400),
      new AdaptiveExitRuleDraftCodePrefixRule("Q"),
    ],
  );
}
