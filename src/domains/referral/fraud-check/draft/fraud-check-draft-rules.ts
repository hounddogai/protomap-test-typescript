import * as text from "../../../../kit/text.js";
import { FraudCheckDraft } from "./fraud-check-draft.js";

/** A rule a fraud check draft must pass. Check returns its problems, or none. */
export interface FraudCheckDraftRule {
  check(item: FraudCheckDraft): string[];
}

export class FraudCheckDraftRequiredUnitRule implements FraudCheckDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckDraft): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckDraftArchivedGuardRule implements FraudCheckDraftRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FraudCheckDraft): string[] {
    if (item.archived && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class FraudCheckDraftCodePrefixRule implements FraudCheckDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FraudCheckDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FraudCheckDraftAllowedCodeRule implements FraudCheckDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FraudCheckDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class FraudCheckDraftDescriptionLengthRule implements FraudCheckDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckDraft): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fraud check draft. */
export class FraudCheckDraftValidator {
  rules: FraudCheckDraftRule[];

  constructor(rules: FraudCheckDraftRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckDraft): string[] {
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

  requireValid(item: FraudCheckDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckDraft[]): Map<string, string[]> {
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

export function defaultFraudCheckDraftValidator(): FraudCheckDraftValidator {
  return new FraudCheckDraftValidator(
    [
      new FraudCheckDraftRequiredUnitRule("fraud check draft needs a value"),
      new FraudCheckDraftArchivedGuardRule(1000),
      new FraudCheckDraftCodePrefixRule("Q"),
      new FraudCheckDraftAllowedCodeRule(["primary"]),
      new FraudCheckDraftDescriptionLengthRule(64),
    ],
  );
}
