import { GlobalDoubleOptInNotice } from "./global-double-opt-in-notice.js";

/** A rule a global double opt in notice must pass. Check returns its problems, or none. */
export interface GlobalDoubleOptInNoticeRule {
  check(item: GlobalDoubleOptInNotice): string[];
}

export class GlobalDoubleOptInNoticeCodePrefixRule implements GlobalDoubleOptInNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalDoubleOptInNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalDoubleOptInNoticeRequiredTitleRule implements GlobalDoubleOptInNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalDoubleOptInNotice): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalDoubleOptInNoticeRequiredContactEmailRule implements GlobalDoubleOptInNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalDoubleOptInNotice): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global double opt in notice. */
export class GlobalDoubleOptInNoticeValidator {
  rules: GlobalDoubleOptInNoticeRule[];

  constructor(rules: GlobalDoubleOptInNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalDoubleOptInNotice): string[] {
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

  requireValid(item: GlobalDoubleOptInNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalDoubleOptInNotice[]): Map<string, string[]> {
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

export function defaultGlobalDoubleOptInNoticeValidator(): GlobalDoubleOptInNoticeValidator {
  return new GlobalDoubleOptInNoticeValidator(
    [
      new GlobalDoubleOptInNoticeCodePrefixRule("REF"),
      new GlobalDoubleOptInNoticeRequiredTitleRule("global double opt in notice needs a value"),
      new GlobalDoubleOptInNoticeRequiredContactEmailRule("global double opt in notice needs an entry"),
    ],
  );
}
