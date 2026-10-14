import * as text from "../../../../kit/text.js";
import { WeightedPaywallAudit } from "./weighted-paywall-audit.js";

/** A rule a weighted paywall audit must pass. Check returns its problems, or none. */
export interface WeightedPaywallAuditRule {
  check(item: WeightedPaywallAudit): string[];
}

export class WeightedPaywallAuditRequiredLabelRule implements WeightedPaywallAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPaywallAudit): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPaywallAuditRequiredJourneyIdRule implements WeightedPaywallAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPaywallAudit): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPaywallAuditJourneyIdLengthRule implements WeightedPaywallAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPaywallAudit): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPaywallAuditAllowedJourneyIdRule implements WeightedPaywallAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedPaywallAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is unknown`];
    return [];
  }
}

/** Runs every rule of a weighted paywall audit. */
export class WeightedPaywallAuditValidator {
  rules: WeightedPaywallAuditRule[];

  constructor(rules: WeightedPaywallAuditRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPaywallAudit): string[] {
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

  requireValid(item: WeightedPaywallAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPaywallAudit[]): Map<string, string[]> {
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

export function defaultWeightedPaywallAuditValidator(): WeightedPaywallAuditValidator {
  return new WeightedPaywallAuditValidator(
    [
      new WeightedPaywallAuditRequiredLabelRule("weighted paywall audit needs an entry"),
      new WeightedPaywallAuditRequiredJourneyIdRule("weighted paywall audit needs an entry"),
      new WeightedPaywallAuditJourneyIdLengthRule(1000),
      new WeightedPaywallAuditAllowedJourneyIdRule([]),
    ],
  );
}
