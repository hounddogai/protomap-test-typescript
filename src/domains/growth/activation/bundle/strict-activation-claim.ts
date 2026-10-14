import * as text from "../../../../kit/text.js";

/** Where a strict activation claim is in its life cycle. */
export type StrictActivationClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** A strict activation claim as the activation team keeps it. */
export class StrictActivationClaim {
  code: string;
  title: string;
  channel: string;
  approved: boolean;
  openRate: number;
  ceiling: number;
  status: StrictActivationClaimStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    approved: boolean,
    openRate: number,
    ceiling: number,
    status: StrictActivationClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.approved = approved;
    this.openRate = openRate;
    this.ceiling = ceiling;
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

  canMoveTo(next: StrictActivationClaimStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
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

  moveTo(next: StrictActivationClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict activation claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict activation claim"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.openRate - this.ceiling) * 100) / 100;
  }

  copy(): StrictActivationClaim {
    return new StrictActivationClaim(
      this.code,
      this.title,
      this.channel,
      this.approved,
      this.openRate,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict activation claim in status new. */
export function newStrictActivationClaim(code: string, title: string): StrictActivationClaim {
  return new StrictActivationClaim(code, title, "", false, 0, 0, "new");
}
