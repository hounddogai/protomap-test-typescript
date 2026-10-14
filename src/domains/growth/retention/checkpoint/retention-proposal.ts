import * as text from "../../../../kit/text.js";

/** Where a retention proposal is in its life cycle. */
export type RetentionProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One retention proposal, with what the planners need to act on it. */
export class RetentionProposal {
  code: string;
  title: string;
  capacity: number;
  limit: number;
  ownerId: string;
  impressions: number;
  openRate: number;
  name: string;
  status: RetentionProposalStatus;

  constructor(
    code: string,
    title: string,
    capacity: number,
    limit: number,
    ownerId: string,
    impressions: number,
    openRate: number,
    name: string,
    status: RetentionProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.limit = limit;
    this.ownerId = ownerId;
    this.impressions = impressions;
    this.openRate = openRate;
    this.name = name;
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

  canMoveTo(next: RetentionProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RetentionProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round((this.limit - this.capacity) * 100) / 100;
  }

  copy(): RetentionProposal {
    return new RetentionProposal(
      this.code,
      this.title,
      this.capacity,
      this.limit,
      this.ownerId,
      this.impressions,
      this.openRate,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a retention proposal in status draft. */
export function newRetentionProposal(code: string, title: string): RetentionProposal {
  return new RetentionProposal(code, title, 0, 0, "", 0, 0, "", "draft");
}
