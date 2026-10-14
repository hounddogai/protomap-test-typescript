import * as text from "../../../../kit/text.js";

/** Where a nudge rule is in its life cycle. */
export type NudgeRuleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A nudge rule. Its code is unique within a tenant. */
export class NudgeRule {
  code: string;
  name: string;
  campaignRef: string;
  version: number;
  title: string;
  country: string;
  checksum: string;
  limit: number;
  pinned: boolean;
  conversionRate: number;
  status: NudgeRuleStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    version: number,
    title: string,
    country: string,
    checksum: string,
    limit: number,
    pinned: boolean,
    conversionRate: number,
    status: NudgeRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.version = version;
    this.title = title;
    this.country = country;
    this.checksum = checksum;
    this.limit = limit;
    this.pinned = pinned;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: NudgeRuleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: NudgeRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedLoad(): number {
    return Math.round((this.limit + this.version) * 100) / 100;
  }

  copy(): NudgeRule {
    return new NudgeRule(
      this.code,
      this.name,
      this.campaignRef,
      this.version,
      this.title,
      this.country,
      this.checksum,
      this.limit,
      this.pinned,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a nudge rule in status planned. */
export function newNudgeRule(code: string, name: string): NudgeRule {
  return new NudgeRule(code, name, "", 0, "", "", "", 0, false, 0, "planned");
}
