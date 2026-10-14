import { SeasonalPaywallPolicy } from "./seasonal-paywall-policy.js";

/** A rule a seasonal paywall policy must pass. Check returns its problems, or none. */
export interface SeasonalPaywallPolicyRule {
  check(item: SeasonalPaywallPolicy): string[];
}

export class SeasonalPaywallPolicyCodePrefixRule implements SeasonalPaywallPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalPaywallPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalPaywallPolicyRequiredLabelRule implements SeasonalPaywallPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPaywallPolicy): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalPaywallPolicyRequiredCodeRule implements SeasonalPaywallPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPaywallPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalPaywallPolicyApprovedGuardRule implements SeasonalPaywallPolicyRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalPaywallPolicy): string[] {
    if (item.approved && item.margin > this.limit) return [`margin ${item.margin} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a seasonal paywall policy. */
export class SeasonalPaywallPolicyValidator {
  rules: SeasonalPaywallPolicyRule[];

  constructor(rules: SeasonalPaywallPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalPaywallPolicy): string[] {
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

  requireValid(item: SeasonalPaywallPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalPaywallPolicy[]): Map<string, string[]> {
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

export function defaultSeasonalPaywallPolicyValidator(): SeasonalPaywallPolicyValidator {
  return new SeasonalPaywallPolicyValidator(
    [
      new SeasonalPaywallPolicyCodePrefixRule("OPS"),
      new SeasonalPaywallPolicyRequiredLabelRule("seasonal paywall policy needs a value"),
      new SeasonalPaywallPolicyRequiredCodeRule("seasonal paywall policy needs this field"),
      new SeasonalPaywallPolicyApprovedGuardRule(5),
    ],
  );
}
