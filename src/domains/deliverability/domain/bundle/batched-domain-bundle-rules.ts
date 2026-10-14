import { BatchedDomainBundle } from "./batched-domain-bundle.js";

/** A rule a batched domain bundle must pass. Check returns its problems, or none. */
export interface BatchedDomainBundleRule {
  check(item: BatchedDomainBundle): string[];
}

export class BatchedDomainBundleRequiredContactEmailRule implements BatchedDomainBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedDomainBundle): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedDomainBundleTitleLengthRule implements BatchedDomainBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedDomainBundle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedDomainBundleCodeLengthRule implements BatchedDomainBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedDomainBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched domain bundle. */
export class BatchedDomainBundleValidator {
  rules: BatchedDomainBundleRule[];

  constructor(rules: BatchedDomainBundleRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedDomainBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedDomainBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedDomainBundle[]): Map<string, string[]> {
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

export function defaultBatchedDomainBundleValidator(): BatchedDomainBundleValidator {
  return new BatchedDomainBundleValidator(
    [
      new BatchedDomainBundleRequiredContactEmailRule("batched domain bundle needs a value"),
      new BatchedDomainBundleTitleLengthRule(3600),
      new BatchedDomainBundleCodeLengthRule(80),
    ],
  );
}
