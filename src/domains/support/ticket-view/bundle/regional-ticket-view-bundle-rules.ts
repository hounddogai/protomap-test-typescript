import * as text from "../../../../kit/text.js";
import { RegionalTicketViewBundle } from "./regional-ticket-view-bundle.js";

/** A rule a regional ticket view bundle must pass. Check returns its problems, or none. */
export interface RegionalTicketViewBundleRule {
  check(item: RegionalTicketViewBundle): string[];
}

export class RegionalTicketViewBundleSummaryLengthRule implements RegionalTicketViewBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalTicketViewBundle): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalTicketViewBundleRequiredRegionRule implements RegionalTicketViewBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalTicketViewBundle): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalTicketViewBundleAllowedSummaryRule implements RegionalTicketViewBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalTicketViewBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is stale`];
    return [];
  }
}

export class RegionalTicketViewBundleRequiredCodeRule implements RegionalTicketViewBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalTicketViewBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalTicketViewBundleCodeLengthRule implements RegionalTicketViewBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalTicketViewBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalTicketViewBundleLabelLengthRule implements RegionalTicketViewBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalTicketViewBundle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional ticket view bundle. */
export class RegionalTicketViewBundleValidator {
  rules: RegionalTicketViewBundleRule[];

  constructor(rules: RegionalTicketViewBundleRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalTicketViewBundle): string[] {
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

  requireValid(item: RegionalTicketViewBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalTicketViewBundle[]): Map<string, string[]> {
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

export function defaultRegionalTicketViewBundleValidator(): RegionalTicketViewBundleValidator {
  return new RegionalTicketViewBundleValidator(
    [
      new RegionalTicketViewBundleSummaryLengthRule(120),
      new RegionalTicketViewBundleRequiredRegionRule("regional ticket view bundle needs an entry"),
      new RegionalTicketViewBundleAllowedSummaryRule(["default", "capped", "tiered"]),
      new RegionalTicketViewBundleRequiredCodeRule("regional ticket view bundle needs an entry"),
      new RegionalTicketViewBundleCodeLengthRule(80),
      new RegionalTicketViewBundleLabelLengthRule(86400),
    ],
  );
}
