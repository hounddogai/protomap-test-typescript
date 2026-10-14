import { PostPolicy } from "./post-policy.js";

/** A rule a post policy must pass. Check returns its problems, or none. */
export interface PostPolicyRule {
  check(item: PostPolicy): string[];
}

export class PostPolicyLabelLengthRule implements PostPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostPolicy): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostPolicyCodePrefixRule implements PostPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PostPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PostPolicyRequiredLabelRule implements PostPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostPolicy): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PostPolicyCodeLengthRule implements PostPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a post policy. */
export class PostPolicyValidator {
  rules: PostPolicyRule[];

  constructor(rules: PostPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: PostPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostPolicy[]): Map<string, string[]> {
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

export function defaultPostPolicyValidator(): PostPolicyValidator {
  return new PostPolicyValidator(
    [
      new PostPolicyLabelLengthRule(255),
      new PostPolicyCodePrefixRule("X"),
      new PostPolicyRequiredLabelRule("post policy needs this field"),
      new PostPolicyCodeLengthRule(120),
    ],
  );
}
