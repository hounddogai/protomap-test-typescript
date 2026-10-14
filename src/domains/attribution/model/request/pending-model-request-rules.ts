import * as text from "../../../../kit/text.js";
import { PendingModelRequest } from "./pending-model-request.js";

/** A rule a pending model request must pass. Check returns its problems, or none. */
export interface PendingModelRequestRule {
  check(item: PendingModelRequest): string[];
}

export class PendingModelRequestAllowedCurrencyRule implements PendingModelRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingModelRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is missing`];
    return [];
  }
}

export class PendingModelRequestArchivedGuardRule implements PendingModelRequestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingModelRequest): string[] {
    if (item.archived && item.batchSize > this.limit) return [`batch size ${item.batchSize} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PendingModelRequestCodePrefixRule implements PendingModelRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingModelRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingModelRequestCurrencyLengthRule implements PendingModelRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingModelRequest): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending model request. */
export class PendingModelRequestValidator {
  rules: PendingModelRequestRule[];

  constructor(rules: PendingModelRequestRule[]) {
    this.rules = rules;
  }

  validate(item: PendingModelRequest): string[] {
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

  requireValid(item: PendingModelRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingModelRequest[]): Map<string, string[]> {
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

export function defaultPendingModelRequestValidator(): PendingModelRequestValidator {
  return new PendingModelRequestValidator(
    [
      new PendingModelRequestAllowedCurrencyRule(["lenient"]),
      new PendingModelRequestArchivedGuardRule(255),
      new PendingModelRequestCodePrefixRule("ACM"),
      new PendingModelRequestCurrencyLengthRule(1000),
    ],
  );
}
