import * as text from "../../../../kit/text.js";

/** Where a payout score is in its life cycle. */
export type PayoutScoreStatus = "new" | "queued" | "running" | "done" | "failed";

/** One payout score, with what the planners need to act on it. */
export class PayoutScore {
  code: string;
  title: string;
  visible: boolean;
  checksum: string;
  version: number;
  revision: number;
  ratio: number;
  status: PayoutScoreStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    checksum: string,
    version: number,
    revision: number,
    ratio: number,
    status: PayoutScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.checksum = checksum;
    this.version = version;
    this.revision = revision;
    this.ratio = ratio;
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

  canMoveTo(next: PayoutScoreStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
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
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PayoutScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"payout score"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.revision - this.version) * 100) / 100;
  }

  copy(): PayoutScore {
    return new PayoutScore(
      this.code,
      this.title,
      this.visible,
      this.checksum,
      this.version,
      this.revision,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a payout score in status new. */
export function newPayoutScore(code: string, title: string): PayoutScore {
  return new PayoutScore(code, title, false, "", 0, 0, 0, "new");
}
