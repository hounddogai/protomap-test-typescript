import { GlobalPlacementGroup } from "./global-placement-group.js";

/** A rule a global placement group must pass. Check returns its problems, or none. */
export interface GlobalPlacementGroupRule {
  check(item: GlobalPlacementGroup): string[];
}

export class GlobalPlacementGroupArchivedGuardRule implements GlobalPlacementGroupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalPlacementGroup): string[] {
    if (item.archived && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class GlobalPlacementGroupCodePrefixRule implements GlobalPlacementGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalPlacementGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalPlacementGroupCodeLengthRule implements GlobalPlacementGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPlacementGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global placement group. */
export class GlobalPlacementGroupValidator {
  rules: GlobalPlacementGroupRule[];

  constructor(rules: GlobalPlacementGroupRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalPlacementGroup): string[] {
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

  requireValid(item: GlobalPlacementGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalPlacementGroup[]): Map<string, string[]> {
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

export function defaultGlobalPlacementGroupValidator(): GlobalPlacementGroupValidator {
  return new GlobalPlacementGroupValidator(
    [
      new GlobalPlacementGroupArchivedGuardRule(80),
      new GlobalPlacementGroupCodePrefixRule("X"),
      new GlobalPlacementGroupCodeLengthRule(1000),
    ],
  );
}
