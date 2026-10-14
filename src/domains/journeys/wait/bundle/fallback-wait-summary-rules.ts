import { FallbackWaitSummary } from "./fallback-wait-summary.js";

/** A rule a fallback wait summary must pass. Check returns its problems, or none. */
export interface FallbackWaitSummaryRule {
  check(item: FallbackWaitSummary): string[];
}

export class FallbackWaitSummaryRequiredTimezoneRule implements FallbackWaitSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackWaitSummary): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackWaitSummaryTagsLimitRule implements FallbackWaitSummaryRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: FallbackWaitSummary): string[] {
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

export class FallbackWaitSummaryCodePrefixRule implements FallbackWaitSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackWaitSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a fallback wait summary. */
export class FallbackWaitSummaryValidator {
  rules: FallbackWaitSummaryRule[];

  constructor(rules: FallbackWaitSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackWaitSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackWaitSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackWaitSummary[]): Map<string, string[]> {
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

export function defaultFallbackWaitSummaryValidator(): FallbackWaitSummaryValidator {
  return new FallbackWaitSummaryValidator(
    [
      new FallbackWaitSummaryRequiredTimezoneRule("fallback wait summary needs this field"),
      new FallbackWaitSummaryTagsLimitRule(1000, ["scheduled", "adaptive", "pending"]),
      new FallbackWaitSummaryCodePrefixRule("OPS"),
    ],
  );
}
