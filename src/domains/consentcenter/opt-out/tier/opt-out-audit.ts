import * as text from "../../../../kit/text.js";

/** Where a opt out audit is in its life cycle. */
export type OptOutAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A opt out audit. Its code is unique within a tenant. */
export class OptOutAudit {
  code: string;
  title: string;
  impressions: number;
  graceDays: number;
  ceiling: number;
  visible: boolean;
  status: OptOutAuditStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    graceDays: number,
    ceiling: number,
    visible: boolean,
    status: OptOutAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.graceDays = graceDays;
    this.ceiling = ceiling;
    this.visible = visible;
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

  canMoveTo(next: OptOutAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
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

  moveTo(next: OptOutAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"opt out audit"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.ceiling * this.graceDays * 100) / 100;
  }

  copy(): OptOutAudit {
    return new OptOutAudit(
      this.code,
      this.title,
      this.impressions,
      this.graceDays,
      this.ceiling,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a opt out audit in status draft. */
export function newOptOutAudit(code: string, title: string): OptOutAudit {
  return new OptOutAudit(code, title, 0, 0, 0, false, "draft");
}
