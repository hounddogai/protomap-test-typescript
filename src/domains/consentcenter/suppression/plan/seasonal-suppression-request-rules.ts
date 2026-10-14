import * as text from "../../../../kit/text.js";
import { SeasonalSuppressionRequest } from "./seasonal-suppression-request.js";

/** A rule a seasonal suppression request must pass. Check returns its problems, or none. */
export interface SeasonalSuppressionRequestRule {
  check(item: SeasonalSuppressionRequest): string[];
}

export class SeasonalSuppressionRequestCodePrefixRule implements SeasonalSuppressionRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalSuppressionRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalSuppressionRequestRequiredCodeRule implements SeasonalSuppressionRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalSuppressionRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalSuppressionRequestRequiredNameRule implements SeasonalSuppressionRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalSuppressionRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalSuppressionRequestAllowedOwnerIdRule implements SeasonalSuppressionRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalSuppressionRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is missing`];
    return [];
  }
}

/** Runs every rule of a seasonal suppression request. */
export class SeasonalSuppressionRequestValidator {
  rules: SeasonalSuppressionRequestRule[];

  constructor(rules: SeasonalSuppressionRequestRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalSuppressionRequest): string[] {
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

  requireValid(item: SeasonalSuppressionRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalSuppressionRequest[]): Map<string, string[]> {
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

export function defaultSeasonalSuppressionRequestValidator(): SeasonalSuppressionRequestValidator {
  return new SeasonalSuppressionRequestValidator(
    [
      new SeasonalSuppressionRequestCodePrefixRule("ACM"),
      new SeasonalSuppressionRequestRequiredCodeRule("seasonal suppression request needs this field"),
      new SeasonalSuppressionRequestRequiredNameRule("seasonal suppression request needs an entry"),
      new SeasonalSuppressionRequestAllowedOwnerIdRule(["scheduled"]),
    ],
  );
}
