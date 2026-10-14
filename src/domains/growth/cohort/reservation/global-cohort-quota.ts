import * as text from "../../../../kit/text.js";

/** Where a global cohort quota is in its life cycle. */
export type GlobalCohortQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a global cohort quota and its current status. */
export class GlobalCohortQuota {
  code: string;
  name: string;
  expiresAt: number;
  minimum: number;
  locale: string;
  channel: string;
  status: GlobalCohortQuotaStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    minimum: number,
    locale: string,
    channel: string,
    status: GlobalCohortQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.minimum = minimum;
    this.locale = locale;
    this.channel = channel;
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

  canMoveTo(next: GlobalCohortQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalCohortQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global cohort quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveExposure(): number {
    return Math.round(this.minimum * this.expiresAt * 100) / 100;
  }

  copy(): GlobalCohortQuota {
    return new GlobalCohortQuota(
      this.code,
      this.name,
      this.expiresAt,
      this.minimum,
      this.locale,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a global cohort quota in status requested. */
export function newGlobalCohortQuota(code: string, name: string): GlobalCohortQuota {
  return new GlobalCohortQuota(code, name, 0, 0, "", "", "requested");
}
