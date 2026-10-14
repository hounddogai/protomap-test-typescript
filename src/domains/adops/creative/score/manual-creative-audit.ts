import * as text from "../../../../kit/text.js";

/** Where a manual creative audit is in its life cycle. */
export type ManualCreativeAuditStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A manual creative audit as the creative team keeps it. */
export class ManualCreativeAudit {
  code: string;
  title: string;
  createdAt: number;
  active: boolean;
  locale: string;
  cost: number;
  channel: string;
  archived: boolean;
  status: ManualCreativeAuditStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    active: boolean,
    locale: string,
    cost: number,
    channel: string,
    archived: boolean,
    status: ManualCreativeAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.active = active;
    this.locale = locale;
    this.cost = cost;
    this.channel = channel;
    this.archived = archived;
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

  canMoveTo(next: ManualCreativeAuditStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ManualCreativeAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual creative audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.cost - this.createdAt) * 100) / 100;
  }

  copy(): ManualCreativeAudit {
    return new ManualCreativeAudit(
      this.code,
      this.title,
      this.createdAt,
      this.active,
      this.locale,
      this.cost,
      this.channel,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual creative audit in status open. */
export function newManualCreativeAudit(code: string, title: string): ManualCreativeAudit {
  return new ManualCreativeAudit(code, title, 0, false, "", 0, "", false, "open");
}
