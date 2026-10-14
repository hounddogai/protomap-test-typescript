import { CsatRule } from "./csat-rule.js";

/** A rule a csat rule must pass. Check returns its problems, or none. */
export interface CsatRuleRule {
  check(item: CsatRule): string[];
}

export class CsatRuleExternalRefLengthRule implements CsatRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatRule): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatRuleArchivedGuardRule implements CsatRuleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CsatRule): string[] {
    if (item.archived && item.revision > this.limit) return [`revision ${item.revision} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class CsatRuleCodeLengthRule implements CsatRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatRuleCodePrefixRule implements CsatRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CsatRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CsatRuleJourneyIdLengthRule implements CsatRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatRule): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatRuleRequiredCodeRule implements CsatRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a csat rule. */
export class CsatRuleValidator {
  rules: CsatRuleRule[];

  constructor(rules: CsatRuleRule[]) {
    this.rules = rules;
  }

  validate(item: CsatRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatRule[]): Map<string, string[]> {
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

export function defaultCsatRuleValidator(): CsatRuleValidator {
  return new CsatRuleValidator(
    [
      new CsatRuleExternalRefLengthRule(120),
      new CsatRuleArchivedGuardRule(16),
      new CsatRuleCodeLengthRule(64),
      new CsatRuleCodePrefixRule("Q"),
      new CsatRuleJourneyIdLengthRule(64),
      new CsatRuleRequiredCodeRule("csat rule needs this field"),
    ],
  );
}
