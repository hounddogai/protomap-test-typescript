import { StrictWindowTarget } from "./strict-window-target.js";

/** A rule a strict window target must pass. Check returns its problems, or none. */
export interface StrictWindowTargetRule {
  check(item: StrictWindowTarget): string[];
}

export class StrictWindowTargetRequiredLabelRule implements StrictWindowTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictWindowTarget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StrictWindowTargetTagsLimitRule implements StrictWindowTargetRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: StrictWindowTarget): string[] {
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

export class StrictWindowTargetRequiredCodeRule implements StrictWindowTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictWindowTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictWindowTargetCodePrefixRule implements StrictWindowTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictWindowTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictWindowTargetStartsAtRangeRule implements StrictWindowTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictWindowTarget): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a strict window target. */
export class StrictWindowTargetValidator {
  rules: StrictWindowTargetRule[];

  constructor(rules: StrictWindowTargetRule[]) {
    this.rules = rules;
  }

  validate(item: StrictWindowTarget): string[] {
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

  requireValid(item: StrictWindowTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictWindowTarget[]): Map<string, string[]> {
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

export function defaultStrictWindowTargetValidator(): StrictWindowTargetValidator {
  return new StrictWindowTargetValidator(
    [
      new StrictWindowTargetRequiredLabelRule("strict window target needs this field"),
      new StrictWindowTargetTagsLimitRule(1000, ["default", "seasonal"]),
      new StrictWindowTargetRequiredCodeRule("strict window target needs a value"),
      new StrictWindowTargetCodePrefixRule("X"),
      new StrictWindowTargetStartsAtRangeRule(32, 64),
    ],
  );
}
