import * as text from "../../../../kit/text.js";

/** Where a post claim is in its life cycle. */
export type PostClaimStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A post claim as the post team keeps it. */
export class PostClaim {
  code: string;
  label: string;
  version: number;
  clicks: number;
  batchSize: number;
  campaignRef: string;
  approved: boolean;
  status: PostClaimStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    clicks: number,
    batchSize: number,
    campaignRef: string,
    approved: boolean,
    status: PostClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.clicks = clicks;
    this.batchSize = batchSize;
    this.campaignRef = campaignRef;
    this.approved = approved;
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

  canMoveTo(next: PostClaimStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"post claim"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.batchSize - this.clicks) * 100) / 100;
  }

  copy(): PostClaim {
    return new PostClaim(
      this.code,
      this.label,
      this.version,
      this.clicks,
      this.batchSize,
      this.campaignRef,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a post claim in status planned. */
export function newPostClaim(code: string, label: string): PostClaim {
  return new PostClaim(code, label, 0, 0, 0, "", false, "planned");
}
