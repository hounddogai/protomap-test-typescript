import { ManualSlaDigest } from "./manual-sla-digest.js";

/** A rule a manual sla digest must pass. Check returns its problems, or none. */
export interface ManualSlaDigestRule {
  check(item: ManualSlaDigest): string[];
}

export class ManualSlaDigestRequiredCodeRule implements ManualSlaDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualSlaDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualSlaDigestRequiredNotesRule implements ManualSlaDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualSlaDigest): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class ManualSlaDigestRequiredTitleRule implements ManualSlaDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualSlaDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualSlaDigestCodePrefixRule implements ManualSlaDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualSlaDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualSlaDigestRequiredReviewerRule implements ManualSlaDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualSlaDigest): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual sla digest. */
export class ManualSlaDigestValidator {
  rules: ManualSlaDigestRule[];

  constructor(rules: ManualSlaDigestRule[]) {
    this.rules = rules;
  }

  validate(item: ManualSlaDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualSlaDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualSlaDigest[]): Map<string, string[]> {
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

export function defaultManualSlaDigestValidator(): ManualSlaDigestValidator {
  return new ManualSlaDigestValidator(
    [
      new ManualSlaDigestRequiredCodeRule("manual sla digest needs a value"),
      new ManualSlaDigestRequiredNotesRule("manual sla digest needs this field"),
      new ManualSlaDigestRequiredTitleRule("manual sla digest needs a value"),
      new ManualSlaDigestCodePrefixRule("X"),
      new ManualSlaDigestRequiredReviewerRule("manual sla digest needs an entry"),
    ],
  );
}
