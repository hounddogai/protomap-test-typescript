import * as text from "../../../../kit/text.js";

/** Where a adaptive opt out quota is in its life cycle. */
export type AdaptiveOptOutQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a adaptive opt out quota and its current status. */
export class AdaptiveOptOutQuota {
  code: string;
  label: string;
  utmSource: string;
  summary: string;
  phone: string;
  quantity: number;
  status: AdaptiveOptOutQuotaStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    summary: string,
    phone: string,
    quantity: number,
    status: AdaptiveOptOutQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.summary = summary;
    this.phone = phone;
    this.quantity = quantity;
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

  canMoveTo(next: AdaptiveOptOutQuotaStatus): boolean {
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
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: AdaptiveOptOutQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive opt out quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): AdaptiveOptOutQuota {
    return new AdaptiveOptOutQuota(
      this.code,
      this.label,
      this.utmSource,
      this.summary,
      this.phone,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a adaptive opt out quota in status proposed. */
export function newAdaptiveOptOutQuota(code: string, label: string): AdaptiveOptOutQuota {
  return new AdaptiveOptOutQuota(code, label, "", "", "", 0, "proposed");
}
