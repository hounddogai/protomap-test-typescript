import * as text from "../../../../kit/text.js";

/** Where a tiered csat audit is in its life cycle. */
export type TieredCsatAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One tiered csat audit, with what the planners need to act on it. */
export class TieredCsatAudit {
  code: string;
  title: string;
  ceiling: number;
  budget: number;
  journeyId: string;
  startsAt: number;
  ownerId: string;
  discount: number;
  status: TieredCsatAuditStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    budget: number,
    journeyId: string,
    startsAt: number,
    ownerId: string,
    discount: number,
    status: TieredCsatAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.budget = budget;
    this.journeyId = journeyId;
    this.startsAt = startsAt;
    this.ownerId = ownerId;
    this.discount = discount;
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

  canMoveTo(next: TieredCsatAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredCsatAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered csat audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netExposure(): number {
    return Math.round(this.budget * this.discount * 100) / 100;
  }

  copy(): TieredCsatAudit {
    return new TieredCsatAudit(
      this.code,
      this.title,
      this.ceiling,
      this.budget,
      this.journeyId,
      this.startsAt,
      this.ownerId,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered csat audit in status planned. */
export function newTieredCsatAudit(code: string, title: string): TieredCsatAudit {
  return new TieredCsatAudit(code, title, 0, 0, "", 0, "", 0, "planned");
}
