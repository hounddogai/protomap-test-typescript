import * as text from "../../../../kit/text.js";
import { BatchedPostOverride } from "./batched-post-override.js";

/** A rule a batched post override must pass. Check returns its problems, or none. */
export interface BatchedPostOverrideRule {
  check(item: BatchedPostOverride): string[];
}

export class BatchedPostOverrideLabelLengthRule implements BatchedPostOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPostOverride): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPostOverrideCodePrefixRule implements BatchedPostOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedPostOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedPostOverrideAllowedCodeRule implements BatchedPostOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedPostOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class BatchedPostOverrideRequiredJourneyIdRule implements BatchedPostOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPostOverride): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPostOverrideRequiredCodeRule implements BatchedPostOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPostOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPostOverrideCodeLengthRule implements BatchedPostOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPostOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched post override. */
export class BatchedPostOverrideValidator {
  rules: BatchedPostOverrideRule[];

  constructor(rules: BatchedPostOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPostOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedPostOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPostOverride[]): Map<string, string[]> {
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

export function defaultBatchedPostOverrideValidator(): BatchedPostOverrideValidator {
  return new BatchedPostOverrideValidator(
    [
      new BatchedPostOverrideLabelLengthRule(255),
      new BatchedPostOverrideCodePrefixRule("ACM"),
      new BatchedPostOverrideAllowedCodeRule(["scheduled"]),
      new BatchedPostOverrideRequiredJourneyIdRule("batched post override needs a value"),
      new BatchedPostOverrideRequiredCodeRule("batched post override needs a value"),
      new BatchedPostOverrideCodeLengthRule(32),
    ],
  );
}
