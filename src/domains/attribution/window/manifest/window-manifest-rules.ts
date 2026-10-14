import { WindowManifest } from "./window-manifest.js";

/** A rule a window manifest must pass. Check returns its problems, or none. */
export interface WindowManifestRule {
  check(item: WindowManifest): string[];
}

export class WindowManifestTitleLengthRule implements WindowManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowManifestRequiredLocaleRule implements WindowManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowManifest): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class WindowManifestCodePrefixRule implements WindowManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WindowManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a window manifest. */
export class WindowManifestValidator {
  rules: WindowManifestRule[];

  constructor(rules: WindowManifestRule[]) {
    this.rules = rules;
  }

  validate(item: WindowManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WindowManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowManifest[]): Map<string, string[]> {
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

export function defaultWindowManifestValidator(): WindowManifestValidator {
  return new WindowManifestValidator(
    [
      new WindowManifestTitleLengthRule(32),
      new WindowManifestRequiredLocaleRule("window manifest needs an entry"),
      new WindowManifestCodePrefixRule("REF"),
    ],
  );
}
