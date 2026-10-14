import { CreativeManifest } from "./creative-manifest.js";

/** A rule a creative manifest must pass. Check returns its problems, or none. */
export interface CreativeManifestRule {
  check(item: CreativeManifest): string[];
}

export class CreativeManifestRequiredAudienceIdRule implements CreativeManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeManifest): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeManifestCostRangeRule implements CreativeManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeManifest): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreativeManifestTagsLimitRule implements CreativeManifestRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: CreativeManifest): string[] {
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

export class CreativeManifestNameLengthRule implements CreativeManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeManifest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeManifestRequiredSegmentRule implements CreativeManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeManifest): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeManifestAudienceIdLengthRule implements CreativeManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeManifest): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a creative manifest. */
export class CreativeManifestValidator {
  rules: CreativeManifestRule[];

  constructor(rules: CreativeManifestRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeManifest): string[] {
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

  requireValid(item: CreativeManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeManifest[]): Map<string, string[]> {
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

export function defaultCreativeManifestValidator(): CreativeManifestValidator {
  return new CreativeManifestValidator(
    [
      new CreativeManifestRequiredAudienceIdRule("creative manifest needs this field"),
      new CreativeManifestCostRangeRule(9.2, 3064.4),
      new CreativeManifestTagsLimitRule(3600, []),
      new CreativeManifestNameLengthRule(80),
      new CreativeManifestRequiredSegmentRule("creative manifest needs a value"),
      new CreativeManifestAudienceIdLengthRule(255),
    ],
  );
}
