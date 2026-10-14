import * as text from "../../../../kit/text.js";

/** Where a capped sla quota is in its life cycle. */
export type CappedSlaQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** A capped sla quota. Its code is unique within a tenant. */
export class CappedSlaQuota {
  code: string;
  title: string;
  locale: string;
  clicks: number;
  externalRef: string;
  timezone: string;
  status: CappedSlaQuotaStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    clicks: number,
    externalRef: string,
    timezone: string,
    status: CappedSlaQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.clicks = clicks;
    this.externalRef = externalRef;
    this.timezone = timezone;
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

  canMoveTo(next: CappedSlaQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CappedSlaQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped sla quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.clicks;
  }

  copy(): CappedSlaQuota {
    return new CappedSlaQuota(
      this.code,
      this.title,
      this.locale,
      this.clicks,
      this.externalRef,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped sla quota in status requested. */
export function newCappedSlaQuota(code: string, title: string): CappedSlaQuota {
  return new CappedSlaQuota(code, title, "", 0, "", "", "requested");
}
