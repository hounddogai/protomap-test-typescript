import * as text from "../../../../kit/text.js";

/** Where a touchpoint audit is in its life cycle. */
export type TouchpointAuditStatus = "requested" | "granted" | "revoked" | "expired";

/** A touchpoint audit. Its code is unique within a tenant. */
export class TouchpointAudit {
  code: string;
  name: string;
  contactEmail: string;
  locale: string;
  expiresAt: number;
  durationMinutes: number;
  sequence: number;
  channel: string;
  cohort: string;
  country: string;
  status: TouchpointAuditStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    locale: string,
    expiresAt: number,
    durationMinutes: number,
    sequence: number,
    channel: string,
    cohort: string,
    country: string,
    status: TouchpointAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.locale = locale;
    this.expiresAt = expiresAt;
    this.durationMinutes = durationMinutes;
    this.sequence = sequence;
    this.channel = channel;
    this.cohort = cohort;
    this.country = country;
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

  canMoveTo(next: TouchpointAuditStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"touchpoint audit"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.expiresAt - this.durationMinutes) * 100) / 100;
  }

  copy(): TouchpointAudit {
    return new TouchpointAudit(
      this.code,
      this.name,
      this.contactEmail,
      this.locale,
      this.expiresAt,
      this.durationMinutes,
      this.sequence,
      this.channel,
      this.cohort,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a touchpoint audit in status requested. */
export function newTouchpointAudit(code: string, name: string): TouchpointAudit {
  return new TouchpointAudit(code, name, "", "", 0, 0, 0, "", "", "", "requested");
}
