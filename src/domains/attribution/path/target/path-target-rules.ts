import { PathTarget } from "./path-target.js";

/** A rule a path target must pass. Check returns its problems, or none. */
export interface PathTargetRule {
  check(item: PathTarget): string[];
}

export class PathTargetRatioRangeRule implements PathTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathTarget): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PathTargetRequiredChannelRule implements PathTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathTarget): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PathTargetRequiredCodeRule implements PathTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PathTargetTagsLimitRule implements PathTargetRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: PathTarget): string[] {
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

export class PathTargetCodePrefixRule implements PathTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PathTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a path target. */
export class PathTargetValidator {
  rules: PathTargetRule[];

  constructor(rules: PathTargetRule[]) {
    this.rules = rules;
  }

  validate(item: PathTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PathTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathTarget[]): Map<string, string[]> {
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

export function defaultPathTargetValidator(): PathTargetValidator {
  return new PathTargetValidator(
    [
      new PathTargetRatioRangeRule(9.3, 2388.9),
      new PathTargetRequiredChannelRule("path target needs a value"),
      new PathTargetRequiredCodeRule("path target needs a value"),
      new PathTargetTagsLimitRule(86400, ["primary"]),
      new PathTargetCodePrefixRule("REF"),
    ],
  );
}
