import * as text from "../../../../kit/text.js";

/** Where a lenient redemption policy is in its life cycle. */
export type LenientRedemptionPolicyStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One lenient redemption policy, with what the planners need to act on it. */
export class LenientRedemptionPolicy {
  code: string;
  title: string;
  revision: number;
  timezone: string;
  discount: number;
  status: LenientRedemptionPolicyStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    timezone: string,
    discount: number,
    status: LenientRedemptionPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.timezone = timezone;
    this.discount = discount;
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

  canMoveTo(next: LenientRedemptionPolicyStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientRedemptionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient redemption policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"lenient redemption policy"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.discount + this.revision) * 100) / 100;
  }

  copy(): LenientRedemptionPolicy {
    return new LenientRedemptionPolicy(this.code, this.title, this.revision, this.timezone, this.discount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient redemption policy in status planned. */
export function newLenientRedemptionPolicy(code: string, title: string): LenientRedemptionPolicy {
  return new LenientRedemptionPolicy(code, title, 0, "", 0, "planned");
}
