import { DefaultComplaintManifest } from "./default-complaint-manifest.js";

/** A rule a default complaint manifest must pass. Check returns its problems, or none. */
export interface DefaultComplaintManifestRule {
  check(item: DefaultComplaintManifest): string[];
}

export class DefaultComplaintManifestEndsAtRangeRule implements DefaultComplaintManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultComplaintManifest): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultComplaintManifestCodeLengthRule implements DefaultComplaintManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultComplaintManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultComplaintManifestCostRangeRule implements DefaultComplaintManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultComplaintManifest): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultComplaintManifestCodePrefixRule implements DefaultComplaintManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultComplaintManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a default complaint manifest. */
export class DefaultComplaintManifestValidator {
  rules: DefaultComplaintManifestRule[];

  constructor(rules: DefaultComplaintManifestRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultComplaintManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultComplaintManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultComplaintManifest[]): Map<string, string[]> {
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

export function defaultDefaultComplaintManifestValidator(): DefaultComplaintManifestValidator {
  return new DefaultComplaintManifestValidator(
    [
      new DefaultComplaintManifestEndsAtRangeRule(16, 80),
      new DefaultComplaintManifestCodeLengthRule(16),
      new DefaultComplaintManifestCostRangeRule(5, 711.1),
      new DefaultComplaintManifestCodePrefixRule("Q"),
    ],
  );
}
