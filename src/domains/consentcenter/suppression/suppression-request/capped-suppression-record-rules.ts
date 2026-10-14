import * as text from "../../../../kit/text.js";
import { CappedSuppressionRecord } from "./capped-suppression-record.js";

/** A rule a capped suppression record must pass. Check returns its problems, or none. */
export interface CappedSuppressionRecordRule {
  check(item: CappedSuppressionRecord): string[];
}

export class CappedSuppressionRecordCodePrefixRule implements CappedSuppressionRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedSuppressionRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedSuppressionRecordAllowedNameRule implements CappedSuppressionRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedSuppressionRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is missing`];
    return [];
  }
}

export class CappedSuppressionRecordRequiredOwnerIdRule implements CappedSuppressionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSuppressionRecord): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped suppression record. */
export class CappedSuppressionRecordValidator {
  rules: CappedSuppressionRecordRule[];

  constructor(rules: CappedSuppressionRecordRule[]) {
    this.rules = rules;
  }

  validate(item: CappedSuppressionRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedSuppressionRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedSuppressionRecord[]): Map<string, string[]> {
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

export function defaultCappedSuppressionRecordValidator(): CappedSuppressionRecordValidator {
  return new CappedSuppressionRecordValidator(
    [
      new CappedSuppressionRecordCodePrefixRule("Q"),
      new CappedSuppressionRecordAllowedNameRule([]),
      new CappedSuppressionRecordRequiredOwnerIdRule("capped suppression record needs a value"),
    ],
  );
}
