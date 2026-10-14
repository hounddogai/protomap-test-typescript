import * as text from "../../../../kit/text.js";
import { SeasonalFraudCheckClaim } from "./seasonal-fraud-check-claim.js";

/** A rule a seasonal fraud check claim must pass. Check returns its problems, or none. */
export interface SeasonalFraudCheckClaimRule {
  check(item: SeasonalFraudCheckClaim): string[];
}

export class SeasonalFraudCheckClaimCodeLengthRule implements SeasonalFraudCheckClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalFraudCheckClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalFraudCheckClaimRequiredCodeRule implements SeasonalFraudCheckClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalFraudCheckClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalFraudCheckClaimAllowedOwnerIdRule implements SeasonalFraudCheckClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalFraudCheckClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a seasonal fraud check claim. */
export class SeasonalFraudCheckClaimValidator {
  rules: SeasonalFraudCheckClaimRule[];

  constructor(rules: SeasonalFraudCheckClaimRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalFraudCheckClaim): string[] {
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

  requireValid(item: SeasonalFraudCheckClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalFraudCheckClaim[]): Map<string, string[]> {
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

export function defaultSeasonalFraudCheckClaimValidator(): SeasonalFraudCheckClaimValidator {
  return new SeasonalFraudCheckClaimValidator(
    [
      new SeasonalFraudCheckClaimCodeLengthRule(16),
      new SeasonalFraudCheckClaimRequiredCodeRule("seasonal fraud check claim needs a value"),
      new SeasonalFraudCheckClaimAllowedOwnerIdRule(["regional", "batched", "lenient"]),
    ],
  );
}
