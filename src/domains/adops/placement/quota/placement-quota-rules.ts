import { PlacementQuota } from "./placement-quota.js";

/** A rule a placement quota must pass. Check returns its problems, or none. */
export interface PlacementQuotaRule {
  check(item: PlacementQuota): string[];
}

export class PlacementQuotaLabelLengthRule implements PlacementQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementQuotaRequiredCodeRule implements PlacementQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementQuotaCodeLengthRule implements PlacementQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementQuotaRequiredLabelRule implements PlacementQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a placement quota. */
export class PlacementQuotaValidator {
  rules: PlacementQuotaRule[];

  constructor(rules: PlacementQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementQuota[]): Map<string, string[]> {
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

export function defaultPlacementQuotaValidator(): PlacementQuotaValidator {
  return new PlacementQuotaValidator(
    [
      new PlacementQuotaLabelLengthRule(80),
      new PlacementQuotaRequiredCodeRule("placement quota needs this field"),
      new PlacementQuotaCodeLengthRule(86400),
      new PlacementQuotaRequiredLabelRule("placement quota needs this field"),
    ],
  );
}
