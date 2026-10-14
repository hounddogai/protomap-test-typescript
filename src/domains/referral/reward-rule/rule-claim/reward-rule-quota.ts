import * as text from "../../../../kit/text.js";

/** Where a reward rule quota is in its life cycle. */
export type RewardRuleQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** A reward rule quota as the reward rule team keeps it. */
export class RewardRuleQuota {
  code: string;
  label: string;
  utmSource: string;
  windowDays: number;
  campaignRef: string;
  description: string;
  summary: string;
  status: RewardRuleQuotaStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    windowDays: number,
    campaignRef: string,
    description: string,
    summary: string,
    status: RewardRuleQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.windowDays = windowDays;
    this.campaignRef = campaignRef;
    this.description = description;
    this.summary = summary;
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

  canMoveTo(next: RewardRuleQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.windowDays;
  }

  copy(): RewardRuleQuota {
    return new RewardRuleQuota(
      this.code,
      this.label,
      this.utmSource,
      this.windowDays,
      this.campaignRef,
      this.description,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a reward rule quota in status new. */
export function newRewardRuleQuota(code: string, label: string): RewardRuleQuota {
  return new RewardRuleQuota(code, label, "", 0, "", "", "", "new");
}
