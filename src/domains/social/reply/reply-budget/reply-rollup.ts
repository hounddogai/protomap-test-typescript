import * as text from "../../../../kit/text.js";

/** Where a reply rollup is in its life cycle. */
export type ReplyRollupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One reply rollup, with what the planners need to act on it. */
export class ReplyRollup {
  code: string;
  title: string;
  checksum: string;
  audienceId: string;
  summary: string;
  amount: number;
  status: ReplyRollupStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    audienceId: string,
    summary: string,
    amount: number,
    status: ReplyRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.audienceId = audienceId;
    this.summary = summary;
    this.amount = amount;
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

  canMoveTo(next: ReplyRollupStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReplyRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"reply rollup"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): ReplyRollup {
    return new ReplyRollup(
      this.code,
      this.title,
      this.checksum,
      this.audienceId,
      this.summary,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reply rollup in status draft. */
export function newReplyRollup(code: string, title: string): ReplyRollup {
  return new ReplyRollup(code, title, "", "", "", 0, "draft");
}
