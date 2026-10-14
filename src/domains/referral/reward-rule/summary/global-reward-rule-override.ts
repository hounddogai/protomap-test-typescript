import * as text from "../../../../kit/text.js";

/** Where a global reward rule override is in its life cycle. */
export type GlobalRewardRuleOverrideStatus = "new" | "queued" | "running" | "done" | "failed";

/** A global reward rule override as the reward rule team keeps it. */
export class GlobalRewardRuleOverride {
  code: string;
  name: string;
  campaignRef: string;
  discount: number;
  timezone: string;
  archived: boolean;
  checksum: string;
  status: GlobalRewardRuleOverrideStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    discount: number,
    timezone: string,
    archived: boolean,
    checksum: string,
    status: GlobalRewardRuleOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.discount = discount;
    this.timezone = timezone;
    this.archived = archived;
    this.checksum = checksum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalRewardRuleOverrideStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: GlobalRewardRuleOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global reward rule override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): GlobalRewardRuleOverride {
    return new GlobalRewardRuleOverride(
      this.code,
      this.name,
      this.campaignRef,
      this.discount,
      this.timezone,
      this.archived,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global reward rule override in status new. */
export function newGlobalRewardRuleOverride(code: string, name: string): GlobalRewardRuleOverride {
  return new GlobalRewardRuleOverride(code, name, "", 0, "", false, "", "new");
}
