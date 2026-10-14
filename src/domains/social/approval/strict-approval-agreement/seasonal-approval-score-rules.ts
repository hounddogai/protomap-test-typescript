import * as text from "../../../../kit/text.js";
import { SeasonalApprovalScore } from "./seasonal-approval-score.js";

/** A rule a seasonal approval score must pass. Check returns its problems, or none. */
export interface SeasonalApprovalScoreRule {
  check(item: SeasonalApprovalScore): string[];
}

export class SeasonalApprovalScoreAllowedDescriptionRule implements SeasonalApprovalScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalApprovalScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is blocked`];
    return [];
  }
}

export class SeasonalApprovalScoreCodeLengthRule implements SeasonalApprovalScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalApprovalScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalApprovalScoreRequiredCodeRule implements SeasonalApprovalScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalApprovalScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalApprovalScoreDescriptionLengthRule implements SeasonalApprovalScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalApprovalScore): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalApprovalScoreNameLengthRule implements SeasonalApprovalScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalApprovalScore): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal approval score. */
export class SeasonalApprovalScoreValidator {
  rules: SeasonalApprovalScoreRule[];

  constructor(rules: SeasonalApprovalScoreRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalApprovalScore): string[] {
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

  requireValid(item: SeasonalApprovalScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalApprovalScore[]): Map<string, string[]> {
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

export function defaultSeasonalApprovalScoreValidator(): SeasonalApprovalScoreValidator {
  return new SeasonalApprovalScoreValidator(
    [
      new SeasonalApprovalScoreAllowedDescriptionRule(["scheduled", "legacy", "legacy"]),
      new SeasonalApprovalScoreCodeLengthRule(3600),
      new SeasonalApprovalScoreRequiredCodeRule("seasonal approval score needs a value"),
      new SeasonalApprovalScoreDescriptionLengthRule(3600),
      new SeasonalApprovalScoreNameLengthRule(16),
    ],
  );
}
