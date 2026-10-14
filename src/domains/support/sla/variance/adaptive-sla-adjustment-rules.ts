import { AdaptiveSlaAdjustment } from "./adaptive-sla-adjustment.js";

/** A rule a adaptive sla adjustment must pass. Check returns its problems, or none. */
export interface AdaptiveSlaAdjustmentRule {
  check(item: AdaptiveSlaAdjustment): string[];
}

export class AdaptiveSlaAdjustmentCodePrefixRule implements AdaptiveSlaAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveSlaAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveSlaAdjustmentContactEmailLengthRule implements AdaptiveSlaAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveSlaAdjustment): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveSlaAdjustmentRequiredAudienceIdRule implements AdaptiveSlaAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveSlaAdjustment): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveSlaAdjustmentVisibleGuardRule implements AdaptiveSlaAdjustmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveSlaAdjustment): string[] {
    if (item.visible && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class AdaptiveSlaAdjustmentAudienceIdLengthRule implements AdaptiveSlaAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveSlaAdjustment): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive sla adjustment. */
export class AdaptiveSlaAdjustmentValidator {
  rules: AdaptiveSlaAdjustmentRule[];

  constructor(rules: AdaptiveSlaAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveSlaAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveSlaAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveSlaAdjustment[]): Map<string, string[]> {
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

export function defaultAdaptiveSlaAdjustmentValidator(): AdaptiveSlaAdjustmentValidator {
  return new AdaptiveSlaAdjustmentValidator(
    [
      new AdaptiveSlaAdjustmentCodePrefixRule("ACM"),
      new AdaptiveSlaAdjustmentContactEmailLengthRule(255),
      new AdaptiveSlaAdjustmentRequiredAudienceIdRule("adaptive sla adjustment needs this field"),
      new AdaptiveSlaAdjustmentVisibleGuardRule(80),
      new AdaptiveSlaAdjustmentAudienceIdLengthRule(255),
    ],
  );
}
