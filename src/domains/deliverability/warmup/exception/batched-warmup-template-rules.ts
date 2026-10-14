import * as text from "../../../../kit/text.js";
import { BatchedWarmupTemplate } from "./batched-warmup-template.js";

/** A rule a batched warmup template must pass. Check returns its problems, or none. */
export interface BatchedWarmupTemplateRule {
  check(item: BatchedWarmupTemplate): string[];
}

export class BatchedWarmupTemplateAllowedSegmentRule implements BatchedWarmupTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedWarmupTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is below minimum`];
    return [];
  }
}

export class BatchedWarmupTemplateRequiredCodeRule implements BatchedWarmupTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWarmupTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedWarmupTemplateCodePrefixRule implements BatchedWarmupTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedWarmupTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedWarmupTemplateNameLengthRule implements BatchedWarmupTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedWarmupTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched warmup template. */
export class BatchedWarmupTemplateValidator {
  rules: BatchedWarmupTemplateRule[];

  constructor(rules: BatchedWarmupTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedWarmupTemplate): string[] {
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

  requireValid(item: BatchedWarmupTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedWarmupTemplate[]): Map<string, string[]> {
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

export function defaultBatchedWarmupTemplateValidator(): BatchedWarmupTemplateValidator {
  return new BatchedWarmupTemplateValidator(
    [
      new BatchedWarmupTemplateAllowedSegmentRule(["regional", "seasonal", "default"]),
      new BatchedWarmupTemplateRequiredCodeRule("batched warmup template needs a value"),
      new BatchedWarmupTemplateCodePrefixRule("REF"),
      new BatchedWarmupTemplateNameLengthRule(120),
    ],
  );
}
