import { TieredDomainThreshold } from "./tiered-domain-threshold.js";

/** A rule a tiered domain threshold must pass. Check returns its problems, or none. */
export interface TieredDomainThresholdRule {
  check(item: TieredDomainThreshold): string[];
}

export class TieredDomainThresholdRequiredNameRule implements TieredDomainThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredDomainThreshold): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredDomainThresholdNameLengthRule implements TieredDomainThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDomainThreshold): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDomainThresholdTagsLimitRule implements TieredDomainThresholdRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: TieredDomainThreshold): string[] {
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

/** Runs every rule of a tiered domain threshold. */
export class TieredDomainThresholdValidator {
  rules: TieredDomainThresholdRule[];

  constructor(rules: TieredDomainThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: TieredDomainThreshold): string[] {
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

  requireValid(item: TieredDomainThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredDomainThreshold[]): Map<string, string[]> {
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

export function defaultTieredDomainThresholdValidator(): TieredDomainThresholdValidator {
  return new TieredDomainThresholdValidator(
    [
      new TieredDomainThresholdRequiredNameRule("tiered domain threshold needs this field"),
      new TieredDomainThresholdNameLengthRule(86400),
      new TieredDomainThresholdTagsLimitRule(32, []),
    ],
  );
}
