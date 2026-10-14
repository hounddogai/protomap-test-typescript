import * as text from "../../../../kit/text.js";

/** Where a paywall claim is in its life cycle. */
export type PaywallClaimStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a paywall claim and its current status. */
export class PaywallClaim {
  code: string;
  title: string;
  visible: boolean;
  audienceId: string;
  attempts: number;
  checksum: string;
  capacity: number;
  status: PaywallClaimStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    audienceId: string,
    attempts: number,
    checksum: string,
    capacity: number,
    status: PaywallClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.audienceId = audienceId;
    this.attempts = attempts;
    this.checksum = checksum;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PaywallClaimStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PaywallClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"paywall claim"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.capacity + this.attempts) * 100) / 100;
  }

  copy(): PaywallClaim {
    return new PaywallClaim(
      this.code,
      this.title,
      this.visible,
      this.audienceId,
      this.attempts,
      this.checksum,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a paywall claim in status proposed. */
export function newPaywallClaim(code: string, title: string): PaywallClaim {
  return new PaywallClaim(code, title, false, "", 0, "", 0, "proposed");
}
