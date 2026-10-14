import { CappedDomainMapping } from "./capped-domain-mapping.js";

/** A rule a capped domain mapping must pass. Check returns its problems, or none. */
export interface CappedDomainMappingRule {
  check(item: CappedDomainMapping): string[];
}

export class CappedDomainMappingOwnerIdLengthRule implements CappedDomainMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedDomainMapping): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedDomainMappingCampaignRefLengthRule implements CappedDomainMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedDomainMapping): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedDomainMappingRequiredCodeRule implements CappedDomainMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedDomainMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedDomainMappingVisibleGuardRule implements CappedDomainMappingRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedDomainMapping): string[] {
    if (item.visible && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class CappedDomainMappingRequiredOwnerIdRule implements CappedDomainMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedDomainMapping): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped domain mapping. */
export class CappedDomainMappingValidator {
  rules: CappedDomainMappingRule[];

  constructor(rules: CappedDomainMappingRule[]) {
    this.rules = rules;
  }

  validate(item: CappedDomainMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedDomainMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedDomainMapping[]): Map<string, string[]> {
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

export function defaultCappedDomainMappingValidator(): CappedDomainMappingValidator {
  return new CappedDomainMappingValidator(
    [
      new CappedDomainMappingOwnerIdLengthRule(32),
      new CappedDomainMappingCampaignRefLengthRule(16),
      new CappedDomainMappingRequiredCodeRule("capped domain mapping needs an entry"),
      new CappedDomainMappingVisibleGuardRule(2.3),
      new CappedDomainMappingRequiredOwnerIdRule("capped domain mapping needs an entry"),
    ],
  );
}
