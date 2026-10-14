import { CohortBaseline } from "./cohort-baseline.js";

/** A rule a cohort baseline must pass. Check returns its problems, or none. */
export interface CohortBaselineRule {
  check(item: CohortBaseline): string[];
}

export class CohortBaselineLocaleLengthRule implements CohortBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortBaseline): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortBaselineCodePrefixRule implements CohortBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CohortBaselineTagsLimitRule implements CohortBaselineRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: CohortBaseline): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class CohortBaselineRequiredCodeRule implements CohortBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CohortBaselineRequiredRegionRule implements CohortBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortBaseline): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a cohort baseline. */
export class CohortBaselineValidator {
  rules: CohortBaselineRule[];

  constructor(rules: CohortBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: CohortBaseline): string[] {
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

  requireValid(item: CohortBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortBaseline[]): Map<string, string[]> {
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

export function defaultCohortBaselineValidator(): CohortBaselineValidator {
  return new CohortBaselineValidator(
    [
      new CohortBaselineLocaleLengthRule(120),
      new CohortBaselineCodePrefixRule("REF"),
      new CohortBaselineTagsLimitRule(1000, ["manual"]),
      new CohortBaselineRequiredCodeRule("cohort baseline needs this field"),
      new CohortBaselineRequiredRegionRule("cohort baseline needs this field"),
    ],
  );
}
