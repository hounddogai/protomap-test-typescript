import { DomainSummary } from "./domain-summary.js";

/** A rule a domain summary must pass. Check returns its problems, or none. */
export interface DomainSummaryRule {
  check(item: DomainSummary): string[];
}

export class DomainSummaryRequiredCodeRule implements DomainSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DomainSummaryApprovedGuardRule implements DomainSummaryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DomainSummary): string[] {
    if (item.approved && item.expiresAt > this.limit) return [`expires at ${item.expiresAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class DomainSummaryCampaignRefLengthRule implements DomainSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainSummary): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainSummaryCodePrefixRule implements DomainSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DomainSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DomainSummaryCodeLengthRule implements DomainSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a domain summary. */
export class DomainSummaryValidator {
  rules: DomainSummaryRule[];

  constructor(rules: DomainSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: DomainSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DomainSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainSummary[]): Map<string, string[]> {
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

export function defaultDomainSummaryValidator(): DomainSummaryValidator {
  return new DomainSummaryValidator(
    [
      new DomainSummaryRequiredCodeRule("domain summary needs a value"),
      new DomainSummaryApprovedGuardRule(1000),
      new DomainSummaryCampaignRefLengthRule(3600),
      new DomainSummaryCodePrefixRule("X"),
      new DomainSummaryCodeLengthRule(1000),
    ],
  );
}
