import { PendingPathRule } from "./pending-path-rule.js";

/** A rule a pending path rule must pass. Check returns its problems, or none. */
export interface PendingPathRuleRule {
  check(item: PendingPathRule): string[];
}

export class PendingPathRuleRequiredUtmSourceRule implements PendingPathRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPathRule): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class PendingPathRuleExternalRefLengthRule implements PendingPathRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPathRule): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPathRuleTitleLengthRule implements PendingPathRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPathRule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending path rule. */
export class PendingPathRuleValidator {
  rules: PendingPathRuleRule[];

  constructor(rules: PendingPathRuleRule[]) {
    this.rules = rules;
  }

  validate(item: PendingPathRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingPathRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingPathRule[]): Map<string, string[]> {
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

export function defaultPendingPathRuleValidator(): PendingPathRuleValidator {
  return new PendingPathRuleValidator(
    [
      new PendingPathRuleRequiredUtmSourceRule("pending path rule needs an entry"),
      new PendingPathRuleExternalRefLengthRule(64),
      new PendingPathRuleTitleLengthRule(32),
    ],
  );
}
