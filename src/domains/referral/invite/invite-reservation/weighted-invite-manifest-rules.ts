import { WeightedInviteManifest } from "./weighted-invite-manifest.js";

/** A rule a weighted invite manifest must pass. Check returns its problems, or none. */
export interface WeightedInviteManifestRule {
  check(item: WeightedInviteManifest): string[];
}

export class WeightedInviteManifestRequiredCodeRule implements WeightedInviteManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedInviteManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedInviteManifestRequiredTitleRule implements WeightedInviteManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedInviteManifest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedInviteManifestCodeLengthRule implements WeightedInviteManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedInviteManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedInviteManifestLocaleLengthRule implements WeightedInviteManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedInviteManifest): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted invite manifest. */
export class WeightedInviteManifestValidator {
  rules: WeightedInviteManifestRule[];

  constructor(rules: WeightedInviteManifestRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedInviteManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedInviteManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedInviteManifest[]): Map<string, string[]> {
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

export function defaultWeightedInviteManifestValidator(): WeightedInviteManifestValidator {
  return new WeightedInviteManifestValidator(
    [
      new WeightedInviteManifestRequiredCodeRule("weighted invite manifest needs a value"),
      new WeightedInviteManifestRequiredTitleRule("weighted invite manifest needs a value"),
      new WeightedInviteManifestCodeLengthRule(255),
      new WeightedInviteManifestLocaleLengthRule(3600),
    ],
  );
}
