import { RegionalPathBundle } from "./regional-path-bundle.js";

/** A rule a regional path bundle must pass. Check returns its problems, or none. */
export interface RegionalPathBundleRule {
  check(item: RegionalPathBundle): string[];
}

export class RegionalPathBundleRequiredChannelRule implements RegionalPathBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPathBundle): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalPathBundleCodeLengthRule implements RegionalPathBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPathBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPathBundleTagsLimitRule implements RegionalPathBundleRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: RegionalPathBundle): string[] {
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

export class RegionalPathBundleRequiredCodeRule implements RegionalPathBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPathBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalPathBundleRequiredContactEmailRule implements RegionalPathBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPathBundle): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional path bundle. */
export class RegionalPathBundleValidator {
  rules: RegionalPathBundleRule[];

  constructor(rules: RegionalPathBundleRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPathBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalPathBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPathBundle[]): Map<string, string[]> {
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

export function defaultRegionalPathBundleValidator(): RegionalPathBundleValidator {
  return new RegionalPathBundleValidator(
    [
      new RegionalPathBundleRequiredChannelRule("regional path bundle needs an entry"),
      new RegionalPathBundleCodeLengthRule(64),
      new RegionalPathBundleTagsLimitRule(16, []),
      new RegionalPathBundleRequiredCodeRule("regional path bundle needs a value"),
      new RegionalPathBundleRequiredContactEmailRule("regional path bundle needs an entry"),
    ],
  );
}
