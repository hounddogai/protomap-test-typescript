import { SeasonalApprovalManifest } from "./seasonal-approval-manifest.js";

/** A rule a seasonal approval manifest must pass. Check returns its problems, or none. */
export interface SeasonalApprovalManifestRule {
  check(item: SeasonalApprovalManifest): string[];
}

export class SeasonalApprovalManifestCodePrefixRule implements SeasonalApprovalManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalApprovalManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalApprovalManifestRequiredCodeRule implements SeasonalApprovalManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalApprovalManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalApprovalManifestVisibleGuardRule implements SeasonalApprovalManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalApprovalManifest): string[] {
    if (item.visible && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class SeasonalApprovalManifestNameLengthRule implements SeasonalApprovalManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalApprovalManifest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal approval manifest. */
export class SeasonalApprovalManifestValidator {
  rules: SeasonalApprovalManifestRule[];

  constructor(rules: SeasonalApprovalManifestRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalApprovalManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalApprovalManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalApprovalManifest[]): Map<string, string[]> {
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

export function defaultSeasonalApprovalManifestValidator(): SeasonalApprovalManifestValidator {
  return new SeasonalApprovalManifestValidator(
    [
      new SeasonalApprovalManifestCodePrefixRule("OPS"),
      new SeasonalApprovalManifestRequiredCodeRule("seasonal approval manifest needs an entry"),
      new SeasonalApprovalManifestVisibleGuardRule(2.6),
      new SeasonalApprovalManifestNameLengthRule(16),
    ],
  );
}
