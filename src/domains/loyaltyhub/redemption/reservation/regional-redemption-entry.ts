import * as text from "../../../../kit/text.js";

/** Where a regional redemption entry is in its life cycle. */
export type RegionalRedemptionEntryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A regional redemption entry. Its code is unique within a tenant. */
export class RegionalRedemptionEntry {
  code: string;
  name: string;
  channel: string;
  category: string;
  bid: number;
  campaignRef: string;
  audienceId: string;
  status: RegionalRedemptionEntryStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    category: string,
    bid: number,
    campaignRef: string,
    audienceId: string,
    status: RegionalRedemptionEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.category = category;
    this.bid = bid;
    this.campaignRef = campaignRef;
    this.audienceId = audienceId;
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

  canMoveTo(next: RegionalRedemptionEntryStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RegionalRedemptionEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional redemption entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"regional redemption entry"} ${this.code}`;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): RegionalRedemptionEntry {
    return new RegionalRedemptionEntry(
      this.code,
      this.name,
      this.channel,
      this.category,
      this.bid,
      this.campaignRef,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional redemption entry in status draft. */
export function newRegionalRedemptionEntry(code: string, name: string): RegionalRedemptionEntry {
  return new RegionalRedemptionEntry(code, name, "", "", 0, "", "", "draft");
}
