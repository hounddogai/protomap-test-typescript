import * as text from "../../../../kit/text.js";

/** Where a default invite summary is in its life cycle. */
export type DefaultInviteSummaryStatus = "requested" | "granted" | "revoked" | "expired";

/** A default invite summary as the invite team keeps it. */
export class DefaultInviteSummary {
  code: string;
  name: string;
  cohort: string;
  description: string;
  score: number;
  bid: number;
  pinned: boolean;
  status: DefaultInviteSummaryStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    description: string,
    score: number,
    bid: number,
    pinned: boolean,
    status: DefaultInviteSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.description = description;
    this.score = score;
    this.bid = bid;
    this.pinned = pinned;
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

  canMoveTo(next: DefaultInviteSummaryStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DefaultInviteSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default invite summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default invite summary"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round(this.score * this.bid * 100) / 100;
  }

  copy(): DefaultInviteSummary {
    return new DefaultInviteSummary(
      this.code,
      this.name,
      this.cohort,
      this.description,
      this.score,
      this.bid,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default invite summary in status requested. */
export function newDefaultInviteSummary(code: string, name: string): DefaultInviteSummary {
  return new DefaultInviteSummary(code, name, "", "", 0, 0, false, "requested");
}
