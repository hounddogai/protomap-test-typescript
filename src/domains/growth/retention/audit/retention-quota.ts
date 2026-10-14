import * as text from "../../../../kit/text.js";

/** Where a retention quota is in its life cycle. */
export type RetentionQuotaStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One retention quota, with what the planners need to act on it. */
export class RetentionQuota {
  code: string;
  name: string;
  startsAt: number;
  label: string;
  amount: number;
  status: RetentionQuotaStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    label: string,
    amount: number,
    status: RetentionQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.label = label;
    this.amount = amount;
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

  canMoveTo(next: RetentionQuotaStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RetentionQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveValue(): number {
    return Math.round((this.startsAt + this.amount) * 100) / 100;
  }

  copy(): RetentionQuota {
    return new RetentionQuota(this.code, this.name, this.startsAt, this.label, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a retention quota in status planned. */
export function newRetentionQuota(code: string, name: string): RetentionQuota {
  return new RetentionQuota(code, name, 0, "", 0, "planned");
}
