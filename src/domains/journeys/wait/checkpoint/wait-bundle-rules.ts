import { WaitBundle } from "./wait-bundle.js";

/** A rule a wait bundle must pass. Check returns its problems, or none. */
export interface WaitBundleRule {
  check(item: WaitBundle): string[];
}

export class WaitBundleNotesLengthRule implements WaitBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitBundle): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitBundleCodePrefixRule implements WaitBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WaitBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WaitBundleNameLengthRule implements WaitBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitBundleRequiredNotesRule implements WaitBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitBundle): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a wait bundle. */
export class WaitBundleValidator {
  rules: WaitBundleRule[];

  constructor(rules: WaitBundleRule[]) {
    this.rules = rules;
  }

  validate(item: WaitBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WaitBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitBundle[]): Map<string, string[]> {
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

export function defaultWaitBundleValidator(): WaitBundleValidator {
  return new WaitBundleValidator(
    [
      new WaitBundleNotesLengthRule(86400),
      new WaitBundleCodePrefixRule("ACM"),
      new WaitBundleNameLengthRule(32),
      new WaitBundleRequiredNotesRule("wait bundle needs a value"),
    ],
  );
}
