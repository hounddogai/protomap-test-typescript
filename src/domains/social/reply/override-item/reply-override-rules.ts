import { ReplyOverride } from "./reply-override.js";

/** A rule a reply override must pass. Check returns its problems, or none. */
export interface ReplyOverrideRule {
  check(item: ReplyOverride): string[];
}

export class ReplyOverrideCodeLengthRule implements ReplyOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyOverrideRequiredLabelRule implements ReplyOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyOverride): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyOverrideCodePrefixRule implements ReplyOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReplyOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a reply override. */
export class ReplyOverrideValidator {
  rules: ReplyOverrideRule[];

  constructor(rules: ReplyOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyOverride): string[] {
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

  requireValid(item: ReplyOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyOverride[]): Map<string, string[]> {
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

export function defaultReplyOverrideValidator(): ReplyOverrideValidator {
  return new ReplyOverrideValidator(
    [
      new ReplyOverrideCodeLengthRule(64),
      new ReplyOverrideRequiredLabelRule("reply override needs this field"),
      new ReplyOverrideCodePrefixRule("REF"),
    ],
  );
}
