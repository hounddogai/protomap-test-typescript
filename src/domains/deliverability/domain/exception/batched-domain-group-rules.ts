import { BatchedDomainGroup } from "./batched-domain-group.js";

/** A rule a batched domain group must pass. Check returns its problems, or none. */
export interface BatchedDomainGroupRule {
  check(item: BatchedDomainGroup): string[];
}

export class BatchedDomainGroupRequiredCountryRule implements BatchedDomainGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedDomainGroup): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedDomainGroupRequiredNameRule implements BatchedDomainGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedDomainGroup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedDomainGroupRequiredCodeRule implements BatchedDomainGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedDomainGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched domain group. */
export class BatchedDomainGroupValidator {
  rules: BatchedDomainGroupRule[];

  constructor(rules: BatchedDomainGroupRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedDomainGroup): string[] {
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

  requireValid(item: BatchedDomainGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedDomainGroup[]): Map<string, string[]> {
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

export function defaultBatchedDomainGroupValidator(): BatchedDomainGroupValidator {
  return new BatchedDomainGroupValidator(
    [
      new BatchedDomainGroupRequiredCountryRule("batched domain group needs an entry"),
      new BatchedDomainGroupRequiredNameRule("batched domain group needs this field"),
      new BatchedDomainGroupRequiredCodeRule("batched domain group needs an entry"),
    ],
  );
}
