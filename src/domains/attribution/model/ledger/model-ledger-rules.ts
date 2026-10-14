import * as text from "../../../../kit/text.js";
import { ModelLedger } from "./model-ledger.js";

/** A rule a model ledger must pass. Check returns its problems, or none. */
export interface ModelLedgerRule {
  check(item: ModelLedger): string[];
}

export class ModelLedgerRequiredCodeRule implements ModelLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ModelLedgerCodePrefixRule implements ModelLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ModelLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ModelLedgerAllowedTimezoneRule implements ModelLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ModelLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is too long`];
    return [];
  }
}

export class ModelLedgerVisibleGuardRule implements ModelLedgerRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ModelLedger): string[] {
    if (item.visible && item.retries > this.limit) return [`retries ${item.retries} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class ModelLedgerRetriesRangeRule implements ModelLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelLedger): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a model ledger. */
export class ModelLedgerValidator {
  rules: ModelLedgerRule[];

  constructor(rules: ModelLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: ModelLedger): string[] {
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

  requireValid(item: ModelLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelLedger[]): Map<string, string[]> {
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

export function defaultModelLedgerValidator(): ModelLedgerValidator {
  return new ModelLedgerValidator(
    [
      new ModelLedgerRequiredCodeRule("model ledger needs a value"),
      new ModelLedgerCodePrefixRule("ACM"),
      new ModelLedgerAllowedTimezoneRule([]),
      new ModelLedgerVisibleGuardRule(16),
      new ModelLedgerRetriesRangeRule(16, 3600),
    ],
  );
}
