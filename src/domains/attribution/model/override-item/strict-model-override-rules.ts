import * as text from "../../../../kit/text.js";
import { StrictModelOverride } from "./strict-model-override.js";

/** A rule a strict model override must pass. Check returns its problems, or none. */
export interface StrictModelOverrideRule {
  check(item: StrictModelOverride): string[];
}

export class StrictModelOverrideOwnerIdLengthRule implements StrictModelOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictModelOverride): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictModelOverrideRequiredChannelRule implements StrictModelOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictModelOverride): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class StrictModelOverrideAllowedCodeRule implements StrictModelOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictModelOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class StrictModelOverrideRequiredOwnerIdRule implements StrictModelOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictModelOverride): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class StrictModelOverrideChannelLengthRule implements StrictModelOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictModelOverride): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict model override. */
export class StrictModelOverrideValidator {
  rules: StrictModelOverrideRule[];

  constructor(rules: StrictModelOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: StrictModelOverride): string[] {
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

  requireValid(item: StrictModelOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictModelOverride[]): Map<string, string[]> {
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

export function defaultStrictModelOverrideValidator(): StrictModelOverrideValidator {
  return new StrictModelOverrideValidator(
    [
      new StrictModelOverrideOwnerIdLengthRule(16),
      new StrictModelOverrideRequiredChannelRule("strict model override needs an entry"),
      new StrictModelOverrideAllowedCodeRule(["weighted", "primary", "regional"]),
      new StrictModelOverrideRequiredOwnerIdRule("strict model override needs a value"),
      new StrictModelOverrideChannelLengthRule(32),
    ],
  );
}
