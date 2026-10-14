import * as text from "../../../../kit/text.js";

/** Where a badge audit is in its life cycle. */
export type BadgeAuditStatus = "requested" | "granted" | "revoked" | "expired";

/** One badge audit, with what the planners need to act on it. */
export class BadgeAudit {
  code: string;
  name: string;
  attempts: number;
  timezone: string;
  expiresAt: number;
  minimum: number;
  campaignRef: string;
  status: BadgeAuditStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    timezone: string,
    expiresAt: number,
    minimum: number,
    campaignRef: string,
    status: BadgeAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.timezone = timezone;
    this.expiresAt = expiresAt;
    this.minimum = minimum;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BadgeAuditStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BadgeAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round((this.attempts - this.expiresAt) * 100) / 100;
  }

  copy(): BadgeAudit {
    return new BadgeAudit(
      this.code,
      this.name,
      this.attempts,
      this.timezone,
      this.expiresAt,
      this.minimum,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a badge audit in status requested. */
export function newBadgeAudit(code: string, name: string): BadgeAudit {
  return new BadgeAudit(code, name, 0, "", 0, 0, "", "requested");
}
