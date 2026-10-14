import * as text from "../../../../kit/text.js";

/** Where a pending invite policy is in its life cycle. */
export type PendingInvitePolicyStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A pending invite policy as the invite team keeps it. */
export class PendingInvitePolicy {
  code: string;
  label: string;
  version: number;
  category: string;
  clicks: number;
  approved: boolean;
  amount: number;
  ceiling: number;
  status: PendingInvitePolicyStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    category: string,
    clicks: number,
    approved: boolean,
    amount: number,
    ceiling: number,
    status: PendingInvitePolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.category = category;
    this.clicks = clicks;
    this.approved = approved;
    this.amount = amount;
    this.ceiling = ceiling;
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

  canMoveTo(next: PendingInvitePolicyStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PendingInvitePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending invite policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"pending invite policy"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.ceiling * this.amount * 100) / 100;
  }

  copy(): PendingInvitePolicy {
    return new PendingInvitePolicy(
      this.code,
      this.label,
      this.version,
      this.category,
      this.clicks,
      this.approved,
      this.amount,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pending invite policy in status draft. */
export function newPendingInvitePolicy(code: string, label: string): PendingInvitePolicy {
  return new PendingInvitePolicy(code, label, 0, "", 0, false, 0, 0, "draft");
}
