import { TouchpointQuota } from "./touchpoint-quota.js";

/** A rule a touchpoint quota must pass. Check returns its problems, or none. */
export interface TouchpointQuotaRule {
  check(item: TouchpointQuota): string[];
}

export class TouchpointQuotaPhoneLengthRule implements TouchpointQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointQuota): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointQuotaRequiredCodeRule implements TouchpointQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointQuotaTagsLimitRule implements TouchpointQuotaRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: TouchpointQuota): string[] {
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

/** Runs every rule of a touchpoint quota. */
export class TouchpointQuotaValidator {
  rules: TouchpointQuotaRule[];

  constructor(rules: TouchpointQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TouchpointQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointQuota[]): Map<string, string[]> {
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

export function defaultTouchpointQuotaValidator(): TouchpointQuotaValidator {
  return new TouchpointQuotaValidator(
    [
      new TouchpointQuotaPhoneLengthRule(120),
      new TouchpointQuotaRequiredCodeRule("touchpoint quota needs this field"),
      new TouchpointQuotaTagsLimitRule(3600, ["strict", "weighted"]),
    ],
  );
}
