import * as text from "../../../../kit/text.js";

/** Where a batched approval quota is in its life cycle. */
export type BatchedApprovalQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** A batched approval quota as the approval team keeps it. */
export class BatchedApprovalQuota {
  code: string;
  title: string;
  tags: string[];
  channel: string;
  bid: number;
  campaignRef: string;
  variant: string;
  country: string;
  status: BatchedApprovalQuotaStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    channel: string,
    bid: number,
    campaignRef: string,
    variant: string,
    country: string,
    status: BatchedApprovalQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.channel = channel;
    this.bid = bid;
    this.campaignRef = campaignRef;
    this.variant = variant;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedApprovalQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BatchedApprovalQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched approval quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched approval quota"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): BatchedApprovalQuota {
    return new BatchedApprovalQuota(
      this.code,
      this.title,
      this.tags,
      this.channel,
      this.bid,
      this.campaignRef,
      this.variant,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched approval quota in status requested. */
export function newBatchedApprovalQuota(code: string, title: string): BatchedApprovalQuota {
  return new BatchedApprovalQuota(code, title, [], "", 0, "", "", "", "requested");
}
