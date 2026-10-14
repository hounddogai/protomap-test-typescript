import * as text from "../../../../kit/text.js";
import { JourneyVariance } from "./journey-variance.js";

/** A rule a journey variance must pass. Check returns its problems, or none. */
export interface JourneyVarianceRule {
  check(item: JourneyVariance): string[];
}

export class JourneyVarianceExternalRefLengthRule implements JourneyVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyVariance): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyVarianceCodePrefixRule implements JourneyVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: JourneyVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class JourneyVarianceAllowedLocaleRule implements JourneyVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: JourneyVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is below minimum`];
    return [];
  }
}

export class JourneyVarianceRequiredLabelRule implements JourneyVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyVariance): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyVarianceTagsLimitRule implements JourneyVarianceRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: JourneyVariance): string[] {
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

/** Runs every rule of a journey variance. */
export class JourneyVarianceValidator {
  rules: JourneyVarianceRule[];

  constructor(rules: JourneyVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyVariance): string[] {
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

  requireValid(item: JourneyVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyVariance[]): Map<string, string[]> {
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

export function defaultJourneyVarianceValidator(): JourneyVarianceValidator {
  return new JourneyVarianceValidator(
    [
      new JourneyVarianceExternalRefLengthRule(64),
      new JourneyVarianceCodePrefixRule("REF"),
      new JourneyVarianceAllowedLocaleRule(["weighted", "rolling"]),
      new JourneyVarianceRequiredLabelRule("journey variance needs this field"),
      new JourneyVarianceTagsLimitRule(80, ["fallback", "seasonal"]),
    ],
  );
}
