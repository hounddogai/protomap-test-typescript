import * as text from "../../../../kit/text.js";

/** Where a deflection audit is in its life cycle. */
export type DeflectionAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a deflection audit and its current status. */
export class DeflectionAudit {
  code: string;
  title: string;
  locale: string;
  updatedAt: number;
  name: string;
  clicks: number;
  contactEmail: string;
  active: boolean;
  status: DeflectionAuditStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    updatedAt: number,
    name: string,
    clicks: number,
    contactEmail: string,
    active: boolean,
    status: DeflectionAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.updatedAt = updatedAt;
    this.name = name;
    this.clicks = clicks;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: DeflectionAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"deflection audit"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.updatedAt * this.clicks * 100) / 100;
  }

  copy(): DeflectionAudit {
    return new DeflectionAudit(
      this.code,
      this.title,
      this.locale,
      this.updatedAt,
      this.name,
      this.clicks,
      this.contactEmail,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a deflection audit in status proposed. */
export function newDeflectionAudit(code: string, title: string): DeflectionAudit {
  return new DeflectionAudit(code, title, "", 0, "", 0, "", false, "proposed");
}
