import * as text from "../../../../kit/text.js";
import { FallbackSubscriptionAudit } from "./fallback-subscription-audit.js";

/** A rule a fallback subscription audit must pass. Check returns its problems, or none. */
export interface FallbackSubscriptionAuditRule {
  check(item: FallbackSubscriptionAudit): string[];
}

export class FallbackSubscriptionAuditRequiredCodeRule implements FallbackSubscriptionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSubscriptionAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSubscriptionAuditRequiredLabelRule implements FallbackSubscriptionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSubscriptionAudit): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSubscriptionAuditRequiredRegionRule implements FallbackSubscriptionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSubscriptionAudit): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSubscriptionAuditCodePrefixRule implements FallbackSubscriptionAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackSubscriptionAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackSubscriptionAuditRequiredExternalRefRule implements FallbackSubscriptionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSubscriptionAudit): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSubscriptionAuditAllowedRegionRule implements FallbackSubscriptionAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackSubscriptionAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is expired`];
    return [];
  }
}

/** Runs every rule of a fallback subscription audit. */
export class FallbackSubscriptionAuditValidator {
  rules: FallbackSubscriptionAuditRule[];

  constructor(rules: FallbackSubscriptionAuditRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackSubscriptionAudit): string[] {
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

  requireValid(item: FallbackSubscriptionAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackSubscriptionAudit[]): Map<string, string[]> {
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

export function defaultFallbackSubscriptionAuditValidator(): FallbackSubscriptionAuditValidator {
  return new FallbackSubscriptionAuditValidator(
    [
      new FallbackSubscriptionAuditRequiredCodeRule("fallback subscription audit needs an entry"),
      new FallbackSubscriptionAuditRequiredLabelRule("fallback subscription audit needs a value"),
      new FallbackSubscriptionAuditRequiredRegionRule("fallback subscription audit needs an entry"),
      new FallbackSubscriptionAuditCodePrefixRule("Q"),
      new FallbackSubscriptionAuditRequiredExternalRefRule("fallback subscription audit needs a value"),
      new FallbackSubscriptionAuditAllowedRegionRule([]),
    ],
  );
}
