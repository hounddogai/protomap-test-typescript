import * as text from "../../../../kit/text.js";

/** Where a lenient bid rule baseline is in its life cycle. */
export type LenientBidRuleBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A lenient bid rule baseline as the bid rule team keeps it. */
export class LenientBidRuleBaseline {
  code: string;
  title: string;
  startsAt: number;
  visible: boolean;
  contactEmail: string;
  pinned: boolean;
  status: LenientBidRuleBaselineStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    visible: boolean,
    contactEmail: string,
    pinned: boolean,
    status: LenientBidRuleBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.visible = visible;
    this.contactEmail = contactEmail;
    this.pinned = pinned;
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

  canMoveTo(next: LenientBidRuleBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
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

  moveTo(next: LenientBidRuleBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient bid rule baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): LenientBidRuleBaseline {
    return new LenientBidRuleBaseline(
      this.code,
      this.title,
      this.startsAt,
      this.visible,
      this.contactEmail,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient bid rule baseline in status proposed. */
export function newLenientBidRuleBaseline(code: string, title: string): LenientBidRuleBaseline {
  return new LenientBidRuleBaseline(code, title, 0, false, "", false, "proposed");
}
