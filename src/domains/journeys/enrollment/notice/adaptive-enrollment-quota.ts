import * as text from "../../../../kit/text.js";

/** Where a adaptive enrollment quota is in its life cycle. */
export type AdaptiveEnrollmentQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One adaptive enrollment quota, with what the planners need to act on it. */
export class AdaptiveEnrollmentQuota {
  code: string;
  name: string;
  sendAt: number;
  durationMinutes: number;
  impressions: number;
  status: AdaptiveEnrollmentQuotaStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    durationMinutes: number,
    impressions: number,
    status: AdaptiveEnrollmentQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.durationMinutes = durationMinutes;
    this.impressions = impressions;
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

  canMoveTo(next: AdaptiveEnrollmentQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveEnrollmentQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive enrollment quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedValue(): number {
    return Math.round((this.impressions + this.durationMinutes) * 100) / 100;
  }

  copy(): AdaptiveEnrollmentQuota {
    return new AdaptiveEnrollmentQuota(
      this.code,
      this.name,
      this.sendAt,
      this.durationMinutes,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive enrollment quota in status proposed. */
export function newAdaptiveEnrollmentQuota(code: string, name: string): AdaptiveEnrollmentQuota {
  return new AdaptiveEnrollmentQuota(code, name, 0, 0, 0, "proposed");
}
