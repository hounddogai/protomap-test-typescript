import * as text from "../../../../kit/text.js";

/** Where a pacing notice is in its life cycle. */
export type PacingNoticeStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One pacing notice, with what the planners need to act on it. */
export class PacingNotice {
  code: string;
  name: string;
  region: string;
  frequencyCap: number;
  amount: number;
  retries: number;
  status: PacingNoticeStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    frequencyCap: number,
    amount: number,
    retries: number,
    status: PacingNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.frequencyCap = frequencyCap;
    this.amount = amount;
    this.retries = retries;
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

  canMoveTo(next: PacingNoticeStatus): boolean {
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
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netValue(): number {
    return Math.round((this.frequencyCap + this.retries) * 100) / 100;
  }

  copy(): PacingNotice {
    return new PacingNotice(
      this.code,
      this.name,
      this.region,
      this.frequencyCap,
      this.amount,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a pacing notice in status proposed. */
export function newPacingNotice(code: string, name: string): PacingNotice {
  return new PacingNotice(code, name, "", 0, 0, 0, "proposed");
}
