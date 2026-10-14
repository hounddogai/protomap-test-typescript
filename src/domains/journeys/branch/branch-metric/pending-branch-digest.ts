import * as text from "../../../../kit/text.js";

/** Where a pending branch digest is in its life cycle. */
export type PendingBranchDigestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a pending branch digest and its current status. */
export class PendingBranchDigest {
  code: string;
  label: string;
  frequencyCap: number;
  variant: string;
  score: number;
  ownerId: string;
  campaignRef: string;
  status: PendingBranchDigestStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    variant: string,
    score: number,
    ownerId: string,
    campaignRef: string,
    status: PendingBranchDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.variant = variant;
    this.score = score;
    this.ownerId = ownerId;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: PendingBranchDigestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "active";
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

  moveTo(next: PendingBranchDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending branch digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netVolume(): number {
    return Math.round(this.frequencyCap * this.score * 100) / 100;
  }

  copy(): PendingBranchDigest {
    return new PendingBranchDigest(
      this.code,
      this.label,
      this.frequencyCap,
      this.variant,
      this.score,
      this.ownerId,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending branch digest in status draft. */
export function newPendingBranchDigest(code: string, label: string): PendingBranchDigest {
  return new PendingBranchDigest(code, label, 0, "", 0, "", "", "draft");
}
