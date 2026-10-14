import * as text from "../../../../kit/text.js";

/** Where a regional reward rule bundle is in its life cycle. */
export type RegionalRewardRuleBundleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional reward rule bundle as the reward rule team keeps it. */
export class RegionalRewardRuleBundle {
  code: string;
  label: string;
  pinned: boolean;
  ratio: number;
  frequencyCap: number;
  sequence: number;
  description: string;
  contactEmail: string;
  tags: string[];
  impressions: number;
  status: RegionalRewardRuleBundleStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    ratio: number,
    frequencyCap: number,
    sequence: number,
    description: string,
    contactEmail: string,
    tags: string[],
    impressions: number,
    status: RegionalRewardRuleBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.ratio = ratio;
    this.frequencyCap = frequencyCap;
    this.sequence = sequence;
    this.description = description;
    this.contactEmail = contactEmail;
    this.tags = tags;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalRewardRuleBundleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RegionalRewardRuleBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional reward rule bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveVolume(): number {
    return Math.round(this.ratio * this.impressions * 100) / 100;
  }

  copy(): RegionalRewardRuleBundle {
    return new RegionalRewardRuleBundle(
      this.code,
      this.label,
      this.pinned,
      this.ratio,
      this.frequencyCap,
      this.sequence,
      this.description,
      this.contactEmail,
      this.tags,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional reward rule bundle in status open. */
export function newRegionalRewardRuleBundle(code: string, label: string): RegionalRewardRuleBundle {
  return new RegionalRewardRuleBundle(code, label, false, 0, 0, 0, "", "", [], 0, "open");
}
