import * as text from "../../../../kit/text.js";
import { AdaptiveCsatRequest } from "./adaptive-csat-request.js";

/** A rule a adaptive csat request must pass. Check returns its problems, or none. */
export interface AdaptiveCsatRequestRule {
  check(item: AdaptiveCsatRequest): string[];
}

export class AdaptiveCsatRequestSourceLengthRule implements AdaptiveCsatRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveCsatRequest): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveCsatRequestCodePrefixRule implements AdaptiveCsatRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveCsatRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveCsatRequestRequiredNameRule implements AdaptiveCsatRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveCsatRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveCsatRequestAllowedNameRule implements AdaptiveCsatRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveCsatRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class AdaptiveCsatRequestNameLengthRule implements AdaptiveCsatRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveCsatRequest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive csat request. */
export class AdaptiveCsatRequestValidator {
  rules: AdaptiveCsatRequestRule[];

  constructor(rules: AdaptiveCsatRequestRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveCsatRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveCsatRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveCsatRequest[]): Map<string, string[]> {
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

export function defaultAdaptiveCsatRequestValidator(): AdaptiveCsatRequestValidator {
  return new AdaptiveCsatRequestValidator(
    [
      new AdaptiveCsatRequestSourceLengthRule(86400),
      new AdaptiveCsatRequestCodePrefixRule("X"),
      new AdaptiveCsatRequestRequiredNameRule("adaptive csat request needs this field"),
      new AdaptiveCsatRequestAllowedNameRule(["manual", "rolling"]),
      new AdaptiveCsatRequestNameLengthRule(120),
    ],
  );
}
