import * as text from "../../../../kit/text.js";

/** Where a adaptive enrollment audit is in its life cycle. */
export type AdaptiveEnrollmentAuditStatus = "requested" | "granted" | "revoked" | "expired";

/** A adaptive enrollment audit. Its code is unique within a tenant. */
export class AdaptiveEnrollmentAudit {
  code: string;
  name: string;
  rate: number;
  retries: number;
  windowDays: number;
  frequencyCap: number;
  conversionRate: number;
  audienceId: string;
  status: AdaptiveEnrollmentAuditStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    retries: number,
    windowDays: number,
    frequencyCap: number,
    conversionRate: number,
    audienceId: string,
    status: AdaptiveEnrollmentAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.retries = retries;
    this.windowDays = windowDays;
    this.frequencyCap = frequencyCap;
    this.conversionRate = conversionRate;
    this.audienceId = audienceId;
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

  canMoveTo(next: AdaptiveEnrollmentAuditStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
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

  moveTo(next: AdaptiveEnrollmentAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive enrollment audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.conversionRate + this.windowDays) * 100) / 100;
  }

  copy(): AdaptiveEnrollmentAudit {
    return new AdaptiveEnrollmentAudit(
      this.code,
      this.name,
      this.rate,
      this.retries,
      this.windowDays,
      this.frequencyCap,
      this.conversionRate,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive enrollment audit in status requested. */
export function newAdaptiveEnrollmentAudit(code: string, name: string): AdaptiveEnrollmentAudit {
  return new AdaptiveEnrollmentAudit(code, name, 0, 0, 0, 0, 0, "", "requested");
}
