import * as text from "../../../../kit/text.js";
import { TouchpointMapping } from "./touchpoint-mapping.js";

/** A rule a touchpoint mapping must pass. Check returns its problems, or none. */
export interface TouchpointMappingRule {
  check(item: TouchpointMapping): string[];
}

export class TouchpointMappingCodePrefixRule implements TouchpointMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TouchpointMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TouchpointMappingAllowedCodeRule implements TouchpointMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TouchpointMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class TouchpointMappingCountryLengthRule implements TouchpointMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointMapping): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointMappingRequiredNameRule implements TouchpointMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointMapping): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a touchpoint mapping. */
export class TouchpointMappingValidator {
  rules: TouchpointMappingRule[];

  constructor(rules: TouchpointMappingRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointMapping): string[] {
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

  requireValid(item: TouchpointMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointMapping[]): Map<string, string[]> {
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

export function defaultTouchpointMappingValidator(): TouchpointMappingValidator {
  return new TouchpointMappingValidator(
    [
      new TouchpointMappingCodePrefixRule("Q"),
      new TouchpointMappingAllowedCodeRule([]),
      new TouchpointMappingCountryLengthRule(16),
      new TouchpointMappingRequiredNameRule("touchpoint mapping needs a value"),
    ],
  );
}
