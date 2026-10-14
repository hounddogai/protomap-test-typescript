import * as text from "../../../../kit/text.js";
import { ModelPolicy } from "./model-policy.js";

/** A rule a model policy must pass. Check returns its problems, or none. */
export interface ModelPolicyRule {
  check(item: ModelPolicy): string[];
}

export class ModelPolicyAllowedCodeRule implements ModelPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ModelPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class ModelPolicyTagsLimitRule implements ModelPolicyRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ModelPolicy): string[] {
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

export class ModelPolicyRegionLengthRule implements ModelPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelPolicy): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a model policy. */
export class ModelPolicyValidator {
  rules: ModelPolicyRule[];

  constructor(rules: ModelPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: ModelPolicy): string[] {
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

  requireValid(item: ModelPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelPolicy[]): Map<string, string[]> {
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

export function defaultModelPolicyValidator(): ModelPolicyValidator {
  return new ModelPolicyValidator(
    [
      new ModelPolicyAllowedCodeRule(["primary", "tiered"]),
      new ModelPolicyTagsLimitRule(86400, ["regional"]),
      new ModelPolicyRegionLengthRule(64),
    ],
  );
}
