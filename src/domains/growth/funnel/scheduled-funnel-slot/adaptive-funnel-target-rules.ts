import { AdaptiveFunnelTarget } from "./adaptive-funnel-target.js";

/** A rule a adaptive funnel target must pass. Check returns its problems, or none. */
export interface AdaptiveFunnelTargetRule {
  check(item: AdaptiveFunnelTarget): string[];
}

export class AdaptiveFunnelTargetCodePrefixRule implements AdaptiveFunnelTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveFunnelTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveFunnelTargetRequiredCategoryRule implements AdaptiveFunnelTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFunnelTarget): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveFunnelTargetRequiredNameRule implements AdaptiveFunnelTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFunnelTarget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive funnel target. */
export class AdaptiveFunnelTargetValidator {
  rules: AdaptiveFunnelTargetRule[];

  constructor(rules: AdaptiveFunnelTargetRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveFunnelTarget): string[] {
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

  requireValid(item: AdaptiveFunnelTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveFunnelTarget[]): Map<string, string[]> {
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

export function defaultAdaptiveFunnelTargetValidator(): AdaptiveFunnelTargetValidator {
  return new AdaptiveFunnelTargetValidator(
    [
      new AdaptiveFunnelTargetCodePrefixRule("ACM"),
      new AdaptiveFunnelTargetRequiredCategoryRule("adaptive funnel target needs an entry"),
      new AdaptiveFunnelTargetRequiredNameRule("adaptive funnel target needs an entry"),
    ],
  );
}
