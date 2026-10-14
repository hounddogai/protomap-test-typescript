import * as text from "../../../../kit/text.js";

/** Where a strict payout quota is in its life cycle. */
export type StrictPayoutQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One strict payout quota, with what the planners need to act on it. */
export class StrictPayoutQuota {
  code: string;
  title: string;
  threshold: number;
  notes: string;
  ceiling: number;
  locale: string;
  status: StrictPayoutQuotaStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    notes: string,
    ceiling: number,
    locale: string,
    status: StrictPayoutQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.notes = notes;
    this.ceiling = ceiling;
    this.locale = locale;
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

  canMoveTo(next: StrictPayoutQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
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

  moveTo(next: StrictPayoutQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict payout quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict payout quota"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.threshold * this.ceiling * 100) / 100;
  }

  copy(): StrictPayoutQuota {
    return new StrictPayoutQuota(
      this.code,
      this.title,
      this.threshold,
      this.notes,
      this.ceiling,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict payout quota in status proposed. */
export function newStrictPayoutQuota(code: string, title: string): StrictPayoutQuota {
  return new StrictPayoutQuota(code, title, 0, "", 0, "", "proposed");
}
