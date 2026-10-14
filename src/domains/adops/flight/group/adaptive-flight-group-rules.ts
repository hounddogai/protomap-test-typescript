import * as text from "../../../../kit/text.js";
import { AdaptiveFlightGroup } from "./adaptive-flight-group.js";

/** A rule a adaptive flight group must pass. Check returns its problems, or none. */
export interface AdaptiveFlightGroupRule {
  check(item: AdaptiveFlightGroup): string[];
}

export class AdaptiveFlightGroupExternalRefLengthRule implements AdaptiveFlightGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveFlightGroup): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveFlightGroupRequiredExternalRefRule implements AdaptiveFlightGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFlightGroup): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveFlightGroupAudienceIdLengthRule implements AdaptiveFlightGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveFlightGroup): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveFlightGroupAllowedLabelRule implements AdaptiveFlightGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveFlightGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is duplicated`];
    return [];
  }
}

/** Runs every rule of a adaptive flight group. */
export class AdaptiveFlightGroupValidator {
  rules: AdaptiveFlightGroupRule[];

  constructor(rules: AdaptiveFlightGroupRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveFlightGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveFlightGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveFlightGroup[]): Map<string, string[]> {
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

export function defaultAdaptiveFlightGroupValidator(): AdaptiveFlightGroupValidator {
  return new AdaptiveFlightGroupValidator(
    [
      new AdaptiveFlightGroupExternalRefLengthRule(64),
      new AdaptiveFlightGroupRequiredExternalRefRule("adaptive flight group needs this field"),
      new AdaptiveFlightGroupAudienceIdLengthRule(3600),
      new AdaptiveFlightGroupAllowedLabelRule(["lenient", "regional", "legacy"]),
    ],
  );
}
