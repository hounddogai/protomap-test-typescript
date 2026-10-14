import * as text from "../../../../kit/text.js";
import { StrictRedemptionScore } from "./strict-redemption-score.js";

/** A rule a strict redemption score must pass. Check returns its problems, or none. */
export interface StrictRedemptionScoreRule {
  check(item: StrictRedemptionScore): string[];
}

export class StrictRedemptionScoreRequiredCodeRule implements StrictRedemptionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRedemptionScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRedemptionScoreAllowedCodeRule implements StrictRedemptionScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictRedemptionScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class StrictRedemptionScoreRequiredOwnerIdRule implements StrictRedemptionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRedemptionScore): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRedemptionScoreRequiredLabelRule implements StrictRedemptionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRedemptionScore): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRedemptionScoreCodePrefixRule implements StrictRedemptionScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictRedemptionScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict redemption score. */
export class StrictRedemptionScoreValidator {
  rules: StrictRedemptionScoreRule[];

  constructor(rules: StrictRedemptionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: StrictRedemptionScore): string[] {
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

  requireValid(item: StrictRedemptionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictRedemptionScore[]): Map<string, string[]> {
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

export function defaultStrictRedemptionScoreValidator(): StrictRedemptionScoreValidator {
  return new StrictRedemptionScoreValidator(
    [
      new StrictRedemptionScoreRequiredCodeRule("strict redemption score needs a value"),
      new StrictRedemptionScoreAllowedCodeRule([]),
      new StrictRedemptionScoreRequiredOwnerIdRule("strict redemption score needs this field"),
      new StrictRedemptionScoreRequiredLabelRule("strict redemption score needs a value"),
      new StrictRedemptionScoreCodePrefixRule("OPS"),
    ],
  );
}
