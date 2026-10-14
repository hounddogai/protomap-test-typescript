import * as text from "../../../../kit/text.js";
import { RollingJourneyPolicy } from "./rolling-journey-policy.js";

/** A rule a rolling journey policy must pass. Check returns its problems, or none. */
export interface RollingJourneyPolicyRule {
  check(item: RollingJourneyPolicy): string[];
}

export class RollingJourneyPolicyCodePrefixRule implements RollingJourneyPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingJourneyPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingJourneyPolicyRequiredLabelRule implements RollingJourneyPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingJourneyPolicy): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RollingJourneyPolicyAllowedChannelRule implements RollingJourneyPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingJourneyPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is below minimum`];
    return [];
  }
}

export class RollingJourneyPolicyCodeLengthRule implements RollingJourneyPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingJourneyPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingJourneyPolicyRequiredUtmSourceRule implements RollingJourneyPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingJourneyPolicy): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling journey policy. */
export class RollingJourneyPolicyValidator {
  rules: RollingJourneyPolicyRule[];

  constructor(rules: RollingJourneyPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: RollingJourneyPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingJourneyPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingJourneyPolicy[]): Map<string, string[]> {
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

export function defaultRollingJourneyPolicyValidator(): RollingJourneyPolicyValidator {
  return new RollingJourneyPolicyValidator(
    [
      new RollingJourneyPolicyCodePrefixRule("REF"),
      new RollingJourneyPolicyRequiredLabelRule("rolling journey policy needs this field"),
      new RollingJourneyPolicyAllowedChannelRule(["pending"]),
      new RollingJourneyPolicyCodeLengthRule(255),
      new RollingJourneyPolicyRequiredUtmSourceRule("rolling journey policy needs an entry"),
    ],
  );
}
