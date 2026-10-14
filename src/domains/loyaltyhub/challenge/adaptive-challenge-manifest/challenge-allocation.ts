import * as text from "../../../../kit/text.js";

/** Where a challenge allocation is in its life cycle. */
export type ChallengeAllocationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A challenge allocation. Its code is unique within a tenant. */
export class ChallengeAllocation {
  code: string;
  title: string;
  expiresAt: number;
  updatedAt: number;
  segment: string;
  quantity: number;
  weight: number;
  pinned: boolean;
  rate: number;
  bid: number;
  status: ChallengeAllocationStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    updatedAt: number,
    segment: string,
    quantity: number,
    weight: number,
    pinned: boolean,
    rate: number,
    bid: number,
    status: ChallengeAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.updatedAt = updatedAt;
    this.segment = segment;
    this.quantity = quantity;
    this.weight = weight;
    this.pinned = pinned;
    this.rate = rate;
    this.bid = bid;
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

  canMoveTo(next: ChallengeAllocationStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ChallengeAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"challenge allocation"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.weight - this.expiresAt) * 100) / 100;
  }

  copy(): ChallengeAllocation {
    return new ChallengeAllocation(
      this.code,
      this.title,
      this.expiresAt,
      this.updatedAt,
      this.segment,
      this.quantity,
      this.weight,
      this.pinned,
      this.rate,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a challenge allocation in status draft. */
export function newChallengeAllocation(code: string, title: string): ChallengeAllocation {
  return new ChallengeAllocation(code, title, 0, 0, "", 0, 0, false, 0, 0, "draft");
}
