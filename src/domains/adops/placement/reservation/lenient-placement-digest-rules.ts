import * as text from "../../../../kit/text.js";
import { LenientPlacementDigest } from "./lenient-placement-digest.js";

/** A rule a lenient placement digest must pass. Check returns its problems, or none. */
export interface LenientPlacementDigestRule {
  check(item: LenientPlacementDigest): string[];
}

export class LenientPlacementDigestRequiredLabelRule implements LenientPlacementDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPlacementDigest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPlacementDigestLabelLengthRule implements LenientPlacementDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPlacementDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPlacementDigestRequiredJourneyIdRule implements LenientPlacementDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPlacementDigest): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPlacementDigestAllowedCodeRule implements LenientPlacementDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientPlacementDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class LenientPlacementDigestCodePrefixRule implements LenientPlacementDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientPlacementDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a lenient placement digest. */
export class LenientPlacementDigestValidator {
  rules: LenientPlacementDigestRule[];

  constructor(rules: LenientPlacementDigestRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPlacementDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientPlacementDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPlacementDigest[]): Map<string, string[]> {
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

export function defaultLenientPlacementDigestValidator(): LenientPlacementDigestValidator {
  return new LenientPlacementDigestValidator(
    [
      new LenientPlacementDigestRequiredLabelRule("lenient placement digest needs this field"),
      new LenientPlacementDigestLabelLengthRule(3600),
      new LenientPlacementDigestRequiredJourneyIdRule("lenient placement digest needs an entry"),
      new LenientPlacementDigestAllowedCodeRule(["adaptive", "tiered"]),
      new LenientPlacementDigestCodePrefixRule("OPS"),
    ],
  );
}
