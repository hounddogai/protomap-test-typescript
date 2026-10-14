import * as text from "../../../../kit/text.js";
import { JourneyMapping } from "./journey-mapping.js";

/** A rule a journey mapping must pass. Check returns its problems, or none. */
export interface JourneyMappingRule {
  check(item: JourneyMapping): string[];
}

export class JourneyMappingAllowedCodeRule implements JourneyMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: JourneyMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class JourneyMappingRequiredChannelRule implements JourneyMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyMapping): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyMappingCodeLengthRule implements JourneyMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyMappingRequiredTimezoneRule implements JourneyMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyMapping): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyMappingCodePrefixRule implements JourneyMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: JourneyMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a journey mapping. */
export class JourneyMappingValidator {
  rules: JourneyMappingRule[];

  constructor(rules: JourneyMappingRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyMapping): string[] {
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

  requireValid(item: JourneyMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyMapping[]): Map<string, string[]> {
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

export function defaultJourneyMappingValidator(): JourneyMappingValidator {
  return new JourneyMappingValidator(
    [
      new JourneyMappingAllowedCodeRule([]),
      new JourneyMappingRequiredChannelRule("journey mapping needs this field"),
      new JourneyMappingCodeLengthRule(255),
      new JourneyMappingRequiredTimezoneRule("journey mapping needs a value"),
      new JourneyMappingCodePrefixRule("Q"),
    ],
  );
}
