import * as text from "../../../../kit/text.js";
import { CappedStepRequest } from "./capped-step-request.js";

/** A rule a capped step request must pass. Check returns its problems, or none. */
export interface CappedStepRequestRule {
  check(item: CappedStepRequest): string[];
}

export class CappedStepRequestRequiredTimezoneRule implements CappedStepRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedStepRequest): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class CappedStepRequestAllowedVariantRule implements CappedStepRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedStepRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is blocked`];
    return [];
  }
}

export class CappedStepRequestNameLengthRule implements CappedStepRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedStepRequest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedStepRequestRequiredCodeRule implements CappedStepRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedStepRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedStepRequestTagsLimitRule implements CappedStepRequestRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: CappedStepRequest): string[] {
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

/** Runs every rule of a capped step request. */
export class CappedStepRequestValidator {
  rules: CappedStepRequestRule[];

  constructor(rules: CappedStepRequestRule[]) {
    this.rules = rules;
  }

  validate(item: CappedStepRequest): string[] {
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

  requireValid(item: CappedStepRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedStepRequest[]): Map<string, string[]> {
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

export function defaultCappedStepRequestValidator(): CappedStepRequestValidator {
  return new CappedStepRequestValidator(
    [
      new CappedStepRequestRequiredTimezoneRule("capped step request needs a value"),
      new CappedStepRequestAllowedVariantRule(["capped", "capped"]),
      new CappedStepRequestNameLengthRule(120),
      new CappedStepRequestRequiredCodeRule("capped step request needs this field"),
      new CappedStepRequestTagsLimitRule(86400, []),
    ],
  );
}
