import { PathBaseline } from "./path-baseline.js";

/** A rule a path baseline must pass. Check returns its problems, or none. */
export interface PathBaselineRule {
  check(item: PathBaseline): string[];
}

export class PathBaselineTagsLimitRule implements PathBaselineRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: PathBaseline): string[] {
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

export class PathBaselineRequiredPhoneRule implements PathBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathBaseline): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class PathBaselineCategoryLengthRule implements PathBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathBaseline): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a path baseline. */
export class PathBaselineValidator {
  rules: PathBaselineRule[];

  constructor(rules: PathBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: PathBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PathBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathBaseline[]): Map<string, string[]> {
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

export function defaultPathBaselineValidator(): PathBaselineValidator {
  return new PathBaselineValidator(
    [
      new PathBaselineTagsLimitRule(255, ["global", "pending", "weighted"]),
      new PathBaselineRequiredPhoneRule("path baseline needs a value"),
      new PathBaselineCategoryLengthRule(80),
    ],
  );
}
