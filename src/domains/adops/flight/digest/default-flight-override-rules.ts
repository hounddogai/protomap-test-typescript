import * as text from "../../../../kit/text.js";
import { DefaultFlightOverride } from "./default-flight-override.js";

/** A rule a default flight override must pass. Check returns its problems, or none. */
export interface DefaultFlightOverrideRule {
  check(item: DefaultFlightOverride): string[];
}

export class DefaultFlightOverrideRequiredNameRule implements DefaultFlightOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFlightOverride): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultFlightOverrideNameLengthRule implements DefaultFlightOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFlightOverride): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultFlightOverrideRequiredCodeRule implements DefaultFlightOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFlightOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultFlightOverrideAllowedChannelRule implements DefaultFlightOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultFlightOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is too long`];
    return [];
  }
}

/** Runs every rule of a default flight override. */
export class DefaultFlightOverrideValidator {
  rules: DefaultFlightOverrideRule[];

  constructor(rules: DefaultFlightOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultFlightOverride): string[] {
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

  requireValid(item: DefaultFlightOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultFlightOverride[]): Map<string, string[]> {
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

export function defaultDefaultFlightOverrideValidator(): DefaultFlightOverrideValidator {
  return new DefaultFlightOverrideValidator(
    [
      new DefaultFlightOverrideRequiredNameRule("default flight override needs an entry"),
      new DefaultFlightOverrideNameLengthRule(80),
      new DefaultFlightOverrideRequiredCodeRule("default flight override needs a value"),
      new DefaultFlightOverrideAllowedChannelRule(["lenient", "rolling"]),
    ],
  );
}
