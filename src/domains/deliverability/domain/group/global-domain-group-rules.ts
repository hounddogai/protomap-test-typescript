import { GlobalDomainGroup } from "./global-domain-group.js";

/** A rule a global domain group must pass. Check returns its problems, or none. */
export interface GlobalDomainGroupRule {
  check(item: GlobalDomainGroup): string[];
}

export class GlobalDomainGroupArchivedGuardRule implements GlobalDomainGroupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalDomainGroup): string[] {
    if (item.archived && item.weight > this.limit) return [`weight ${item.weight} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class GlobalDomainGroupRequiredTitleRule implements GlobalDomainGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalDomainGroup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalDomainGroupCodePrefixRule implements GlobalDomainGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalDomainGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a global domain group. */
export class GlobalDomainGroupValidator {
  rules: GlobalDomainGroupRule[];

  constructor(rules: GlobalDomainGroupRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalDomainGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalDomainGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalDomainGroup[]): Map<string, string[]> {
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

export function defaultGlobalDomainGroupValidator(): GlobalDomainGroupValidator {
  return new GlobalDomainGroupValidator(
    [
      new GlobalDomainGroupArchivedGuardRule(7.2),
      new GlobalDomainGroupRequiredTitleRule("global domain group needs an entry"),
      new GlobalDomainGroupCodePrefixRule("ACM"),
    ],
  );
}
