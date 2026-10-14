import { ExitRuleManifest } from "./exit-rule-manifest.js";

/** A rule a exit rule manifest must pass. Check returns its problems, or none. */
export interface ExitRuleManifestRule {
  check(item: ExitRuleManifest): string[];
}

export class ExitRuleManifestCodePrefixRule implements ExitRuleManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ExitRuleManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ExitRuleManifestActiveGuardRule implements ExitRuleManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ExitRuleManifest): string[] {
    if (item.active && item.startsAt > this.limit) return [`starts at ${item.startsAt} exceeds ${this.limit} while active`];
    return [];
  }
}

export class ExitRuleManifestTitleLengthRule implements ExitRuleManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleManifestCodeLengthRule implements ExitRuleManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleManifestPhoneLengthRule implements ExitRuleManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleManifest): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a exit rule manifest. */
export class ExitRuleManifestValidator {
  rules: ExitRuleManifestRule[];

  constructor(rules: ExitRuleManifestRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleManifest[]): Map<string, string[]> {
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

export function defaultExitRuleManifestValidator(): ExitRuleManifestValidator {
  return new ExitRuleManifestValidator(
    [
      new ExitRuleManifestCodePrefixRule("Q"),
      new ExitRuleManifestActiveGuardRule(120),
      new ExitRuleManifestTitleLengthRule(1000),
      new ExitRuleManifestCodeLengthRule(3600),
      new ExitRuleManifestPhoneLengthRule(32),
    ],
  );
}
