import * as text from "../../../../kit/text.js";
import { WarmupAudit } from "./warmup-audit.js";

/** A rule a warmup audit must pass. Check returns its problems, or none. */
export interface WarmupAuditRule {
  check(item: WarmupAudit): string[];
}

export class WarmupAuditRequiredCountryRule implements WarmupAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupAudit): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupAuditAllowedExternalRefRule implements WarmupAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WarmupAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is below minimum`];
    return [];
  }
}

export class WarmupAuditRequiredTitleRule implements WarmupAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupAudit): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a warmup audit. */
export class WarmupAuditValidator {
  rules: WarmupAuditRule[];

  constructor(rules: WarmupAuditRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupAudit[]): Map<string, string[]> {
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

export function defaultWarmupAuditValidator(): WarmupAuditValidator {
  return new WarmupAuditValidator(
    [
      new WarmupAuditRequiredCountryRule("warmup audit needs an entry"),
      new WarmupAuditAllowedExternalRefRule(["seasonal", "default"]),
      new WarmupAuditRequiredTitleRule("warmup audit needs this field"),
    ],
  );
}
