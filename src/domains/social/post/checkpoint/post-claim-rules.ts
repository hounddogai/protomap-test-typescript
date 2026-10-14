import { PostClaim } from "./post-claim.js";

/** A rule a post claim must pass. Check returns its problems, or none. */
export interface PostClaimRule {
  check(item: PostClaim): string[];
}

export class PostClaimRequiredCodeRule implements PostClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PostClaimLabelLengthRule implements PostClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostClaimRequiredLabelRule implements PostClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostClaim): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PostClaimCodePrefixRule implements PostClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PostClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PostClaimApprovedGuardRule implements PostClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PostClaim): string[] {
    if (item.approved && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class PostClaimBatchSizeRangeRule implements PostClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostClaim): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a post claim. */
export class PostClaimValidator {
  rules: PostClaimRule[];

  constructor(rules: PostClaimRule[]) {
    this.rules = rules;
  }

  validate(item: PostClaim): string[] {
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

  requireValid(item: PostClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostClaim[]): Map<string, string[]> {
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

export function defaultPostClaimValidator(): PostClaimValidator {
  return new PostClaimValidator(
    [
      new PostClaimRequiredCodeRule("post claim needs this field"),
      new PostClaimLabelLengthRule(32),
      new PostClaimRequiredLabelRule("post claim needs an entry"),
      new PostClaimCodePrefixRule("OPS"),
      new PostClaimApprovedGuardRule(120),
      new PostClaimBatchSizeRangeRule(120, 86400),
    ],
  );
}
