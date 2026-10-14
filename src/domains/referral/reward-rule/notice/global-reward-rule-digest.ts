import * as text from "../../../../kit/text.js";

/** Where a global reward rule digest is in its life cycle. */
export type GlobalRewardRuleDigestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A global reward rule digest as the reward rule team keeps it. */
export class GlobalRewardRuleDigest {
  code: string;
  label: string;
  impressions: number;
  attributes: Map<string, string>;
  frequencyCap: number;
  status: GlobalRewardRuleDigestStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    attributes: Map<string, string>,
    frequencyCap: number,
    status: GlobalRewardRuleDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.attributes = attributes;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalRewardRuleDigestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: GlobalRewardRuleDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global reward rule digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedValue(): number {
    return Math.round((this.impressions + this.frequencyCap) * 100) / 100;
  }

  copy(): GlobalRewardRuleDigest {
    return new GlobalRewardRuleDigest(
      this.code,
      this.label,
      this.impressions,
      this.attributes,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global reward rule digest in status draft. */
export function newGlobalRewardRuleDigest(code: string, label: string): GlobalRewardRuleDigest {
  return new GlobalRewardRuleDigest(code, label, 0, new Map<string, string>(), 0, "draft");
}
