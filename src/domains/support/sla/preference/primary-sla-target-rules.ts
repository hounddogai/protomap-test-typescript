import * as text from "../../../../kit/text.js";
import { PrimarySlaTarget } from "./primary-sla-target.js";

/** A rule a primary sla target must pass. Check returns its problems, or none. */
export interface PrimarySlaTargetRule {
  check(item: PrimarySlaTarget): string[];
}

export class PrimarySlaTargetCodeLengthRule implements PrimarySlaTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySlaTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimarySlaTargetCodePrefixRule implements PrimarySlaTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimarySlaTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimarySlaTargetAllowedNameRule implements PrimarySlaTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimarySlaTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

/** Runs every rule of a primary sla target. */
export class PrimarySlaTargetValidator {
  rules: PrimarySlaTargetRule[];

  constructor(rules: PrimarySlaTargetRule[]) {
    this.rules = rules;
  }

  validate(item: PrimarySlaTarget): string[] {
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

  requireValid(item: PrimarySlaTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimarySlaTarget[]): Map<string, string[]> {
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

export function defaultPrimarySlaTargetValidator(): PrimarySlaTargetValidator {
  return new PrimarySlaTargetValidator(
    [
      new PrimarySlaTargetCodeLengthRule(32),
      new PrimarySlaTargetCodePrefixRule("X"),
      new PrimarySlaTargetAllowedNameRule([]),
    ],
  );
}
