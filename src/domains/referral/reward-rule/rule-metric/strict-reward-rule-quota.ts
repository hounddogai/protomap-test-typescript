import * as text from "../../../../kit/text.js";

/** Where a strict reward rule quota is in its life cycle. */
export type StrictRewardRuleQuotaStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A strict reward rule quota. Its code is unique within a tenant. */
export class StrictRewardRuleQuota {
  code: string;
  title: string;
  sendAt: number;
  phone: string;
  name: string;
  impressions: number;
  region: string;
  utmSource: string;
  revision: number;
  status: StrictRewardRuleQuotaStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    phone: string,
    name: string,
    impressions: number,
    region: string,
    utmSource: string,
    revision: number,
    status: StrictRewardRuleQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.phone = phone;
    this.name = name;
    this.impressions = impressions;
    this.region = region;
    this.utmSource = utmSource;
    this.revision = revision;
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

  canMoveTo(next: StrictRewardRuleQuotaStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
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

  moveTo(next: StrictRewardRuleQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reward rule quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round((this.sendAt + this.revision) * 100) / 100;
  }

  copy(): StrictRewardRuleQuota {
    return new StrictRewardRuleQuota(
      this.code,
      this.title,
      this.sendAt,
      this.phone,
      this.name,
      this.impressions,
      this.region,
      this.utmSource,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a strict reward rule quota in status open. */
export function newStrictRewardRuleQuota(code: string, title: string): StrictRewardRuleQuota {
  return new StrictRewardRuleQuota(code, title, 0, "", "", 0, "", "", 0, "open");
}
