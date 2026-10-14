import * as text from "../../../../kit/text.js";
import { PathAgreement } from "./path-agreement.js";

/** A rule a path agreement must pass. Check returns its problems, or none. */
export interface PathAgreementRule {
  check(item: PathAgreement): string[];
}

export class PathAgreementCostRangeRule implements PathAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathAgreement): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PathAgreementRequiredCampaignRefRule implements PathAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathAgreement): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class PathAgreementCodePrefixRule implements PathAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PathAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PathAgreementPinnedGuardRule implements PathAgreementRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PathAgreement): string[] {
    if (item.pinned && item.cost > this.limit) return [`cost ${item.cost} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class PathAgreementTitleLengthRule implements PathAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathAgreementAllowedCodeRule implements PathAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PathAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

/** Runs every rule of a path agreement. */
export class PathAgreementValidator {
  rules: PathAgreementRule[];

  constructor(rules: PathAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: PathAgreement): string[] {
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

  requireValid(item: PathAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathAgreement[]): Map<string, string[]> {
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

export function defaultPathAgreementValidator(): PathAgreementValidator {
  return new PathAgreementValidator(
    [
      new PathAgreementCostRangeRule(3.4, 4293.6),
      new PathAgreementRequiredCampaignRefRule("path agreement needs this field"),
      new PathAgreementCodePrefixRule("OPS"),
      new PathAgreementPinnedGuardRule(4),
      new PathAgreementTitleLengthRule(1000),
      new PathAgreementAllowedCodeRule([]),
    ],
  );
}
