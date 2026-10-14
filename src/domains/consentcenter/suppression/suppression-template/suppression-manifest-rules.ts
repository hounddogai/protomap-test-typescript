import { SuppressionManifest } from "./suppression-manifest.js";

/** A rule a suppression manifest must pass. Check returns its problems, or none. */
export interface SuppressionManifestRule {
  check(item: SuppressionManifest): string[];
}

export class SuppressionManifestRequiredDescriptionRule implements SuppressionManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionManifest): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionManifestDescriptionLengthRule implements SuppressionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionManifest): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionManifestCodePrefixRule implements SuppressionManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SuppressionManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a suppression manifest. */
export class SuppressionManifestValidator {
  rules: SuppressionManifestRule[];

  constructor(rules: SuppressionManifestRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionManifest[]): Map<string, string[]> {
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

export function defaultSuppressionManifestValidator(): SuppressionManifestValidator {
  return new SuppressionManifestValidator(
    [
      new SuppressionManifestRequiredDescriptionRule("suppression manifest needs a value"),
      new SuppressionManifestDescriptionLengthRule(64),
      new SuppressionManifestCodePrefixRule("X"),
    ],
  );
}
