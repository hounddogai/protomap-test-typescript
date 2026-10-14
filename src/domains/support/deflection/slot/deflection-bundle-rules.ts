import { DeflectionBundle } from "./deflection-bundle.js";

/** A rule a deflection bundle must pass. Check returns its problems, or none. */
export interface DeflectionBundleRule {
  check(item: DeflectionBundle): string[];
}

export class DeflectionBundleCodePrefixRule implements DeflectionBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DeflectionBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DeflectionBundleRequiredLabelRule implements DeflectionBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionBundle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionBundleRequiredTitleRule implements DeflectionBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionBundle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a deflection bundle. */
export class DeflectionBundleValidator {
  rules: DeflectionBundleRule[];

  constructor(rules: DeflectionBundleRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionBundle): string[] {
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

  requireValid(item: DeflectionBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionBundle[]): Map<string, string[]> {
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

export function defaultDeflectionBundleValidator(): DeflectionBundleValidator {
  return new DeflectionBundleValidator(
    [
      new DeflectionBundleCodePrefixRule("X"),
      new DeflectionBundleRequiredLabelRule("deflection bundle needs an entry"),
      new DeflectionBundleRequiredTitleRule("deflection bundle needs a value"),
    ],
  );
}
