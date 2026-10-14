import { DomainAudit } from "./domain-audit.js";

/** A rule a domain audit must pass. Check returns its problems, or none. */
export interface DomainAuditRule {
  check(item: DomainAudit): string[];
}

export class DomainAuditCodePrefixRule implements DomainAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DomainAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DomainAuditCreatedAtRangeRule implements DomainAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainAudit): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DomainAuditRequiredVariantRule implements DomainAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainAudit): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a domain audit. */
export class DomainAuditValidator {
  rules: DomainAuditRule[];

  constructor(rules: DomainAuditRule[]) {
    this.rules = rules;
  }

  validate(item: DomainAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DomainAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainAudit[]): Map<string, string[]> {
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

export function defaultDomainAuditValidator(): DomainAuditValidator {
  return new DomainAuditValidator(
    [
      new DomainAuditCodePrefixRule("ACM"),
      new DomainAuditCreatedAtRangeRule(80, 120),
      new DomainAuditRequiredVariantRule("domain audit needs an entry"),
    ],
  );
}
