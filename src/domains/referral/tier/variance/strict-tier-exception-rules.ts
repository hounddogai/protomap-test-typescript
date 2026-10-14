import { StrictTierException } from "./strict-tier-exception.js";

/** A rule a strict tier exception must pass. Check returns its problems, or none. */
export interface StrictTierExceptionRule {
  check(item: StrictTierException): string[];
}

export class StrictTierExceptionTagsLimitRule implements StrictTierExceptionRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: StrictTierException): string[] {
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

export class StrictTierExceptionRequiredLabelRule implements StrictTierExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictTierException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StrictTierExceptionRequiredChannelRule implements StrictTierExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictTierException): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict tier exception. */
export class StrictTierExceptionValidator {
  rules: StrictTierExceptionRule[];

  constructor(rules: StrictTierExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: StrictTierException): string[] {
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

  requireValid(item: StrictTierException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictTierException[]): Map<string, string[]> {
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

export function defaultStrictTierExceptionValidator(): StrictTierExceptionValidator {
  return new StrictTierExceptionValidator(
    [
      new StrictTierExceptionTagsLimitRule(120, ["weighted", "seasonal", "manual"]),
      new StrictTierExceptionRequiredLabelRule("strict tier exception needs a value"),
      new StrictTierExceptionRequiredChannelRule("strict tier exception needs an entry"),
    ],
  );
}
