import * as text from "../../../../kit/text.js";
import { FallbackFlightSnapshot } from "./fallback-flight-snapshot.js";

/** A rule a fallback flight snapshot must pass. Check returns its problems, or none. */
export interface FallbackFlightSnapshotRule {
  check(item: FallbackFlightSnapshot): string[];
}

export class FallbackFlightSnapshotLabelLengthRule implements FallbackFlightSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFlightSnapshot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFlightSnapshotCodePrefixRule implements FallbackFlightSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackFlightSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackFlightSnapshotRequiredLabelRule implements FallbackFlightSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFlightSnapshot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackFlightSnapshotCategoryLengthRule implements FallbackFlightSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFlightSnapshot): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFlightSnapshotAllowedCodeRule implements FallbackFlightSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackFlightSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

/** Runs every rule of a fallback flight snapshot. */
export class FallbackFlightSnapshotValidator {
  rules: FallbackFlightSnapshotRule[];

  constructor(rules: FallbackFlightSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackFlightSnapshot): string[] {
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

  requireValid(item: FallbackFlightSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackFlightSnapshot[]): Map<string, string[]> {
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

export function defaultFallbackFlightSnapshotValidator(): FallbackFlightSnapshotValidator {
  return new FallbackFlightSnapshotValidator(
    [
      new FallbackFlightSnapshotLabelLengthRule(1000),
      new FallbackFlightSnapshotCodePrefixRule("ACM"),
      new FallbackFlightSnapshotRequiredLabelRule("fallback flight snapshot needs this field"),
      new FallbackFlightSnapshotCategoryLengthRule(3600),
      new FallbackFlightSnapshotAllowedCodeRule(["lenient", "weighted"]),
    ],
  );
}
