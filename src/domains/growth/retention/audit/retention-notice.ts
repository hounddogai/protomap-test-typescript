import * as text from "../../../../kit/text.js";

/** Where a retention notice is in its life cycle. */
export type RetentionNoticeStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One retention notice, with what the planners need to act on it. */
export class RetentionNotice {
  code: string;
  name: string;
  cost: number;
  checksum: string;
  createdAt: number;
  rate: number;
  cohort: string;
  active: boolean;
  status: RetentionNoticeStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    checksum: string,
    createdAt: number,
    rate: number,
    cohort: string,
    active: boolean,
    status: RetentionNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.checksum = checksum;
    this.createdAt = createdAt;
    this.rate = rate;
    this.cohort = cohort;
    this.active = active;
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

  canMoveTo(next: RetentionNoticeStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
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

  moveTo(next: RetentionNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netLoad(): number {
    return Math.round((this.cost + this.rate) * 100) / 100;
  }

  copy(): RetentionNotice {
    return new RetentionNotice(
      this.code,
      this.name,
      this.cost,
      this.checksum,
      this.createdAt,
      this.rate,
      this.cohort,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a retention notice in status proposed. */
export function newRetentionNotice(code: string, name: string): RetentionNotice {
  return new RetentionNotice(code, name, 0, "", 0, 0, "", false, "proposed");
}
