import * as text from "../../../../kit/text.js";

/** Where a pending invite rollup is in its life cycle. */
export type PendingInviteRollupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One pending invite rollup, with what the planners need to act on it. */
export class PendingInviteRollup {
  code: string;
  title: string;
  ceiling: number;
  score: number;
  graceDays: number;
  name: string;
  discount: number;
  externalRef: string;
  campaignRef: string;
  sequence: number;
  status: PendingInviteRollupStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    score: number,
    graceDays: number,
    name: string,
    discount: number,
    externalRef: string,
    campaignRef: string,
    sequence: number,
    status: PendingInviteRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.score = score;
    this.graceDays = graceDays;
    this.name = name;
    this.discount = discount;
    this.externalRef = externalRef;
    this.campaignRef = campaignRef;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingInviteRollupStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingInviteRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending invite rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending invite rollup"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.score + this.discount) * 100) / 100;
  }

  copy(): PendingInviteRollup {
    return new PendingInviteRollup(
      this.code,
      this.title,
      this.ceiling,
      this.score,
      this.graceDays,
      this.name,
      this.discount,
      this.externalRef,
      this.campaignRef,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending invite rollup in status open. */
export function newPendingInviteRollup(code: string, title: string): PendingInviteRollup {
  return new PendingInviteRollup(code, title, 0, 0, 0, "", 0, "", "", 0, "open");
}
