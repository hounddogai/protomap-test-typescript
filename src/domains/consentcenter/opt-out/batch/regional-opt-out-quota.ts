import * as text from "../../../../kit/text.js";

/** Where a regional opt out quota is in its life cycle. */
export type RegionalOptOutQuotaStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One regional opt out quota, with what the planners need to act on it. */
export class RegionalOptOutQuota {
  code: string;
  title: string;
  startsAt: number;
  locale: string;
  ratio: number;
  frequencyCap: number;
  status: RegionalOptOutQuotaStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    locale: string,
    ratio: number,
    frequencyCap: number,
    status: RegionalOptOutQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.locale = locale;
    this.ratio = ratio;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: RegionalOptOutQuotaStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RegionalOptOutQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional opt out quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedExposure(): number {
    return Math.round((this.ratio + this.frequencyCap) * 100) / 100;
  }

  copy(): RegionalOptOutQuota {
    return new RegionalOptOutQuota(
      this.code,
      this.title,
      this.startsAt,
      this.locale,
      this.ratio,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional opt out quota in status draft. */
export function newRegionalOptOutQuota(code: string, title: string): RegionalOptOutQuota {
  return new RegionalOptOutQuota(code, title, 0, "", 0, 0, "draft");
}
