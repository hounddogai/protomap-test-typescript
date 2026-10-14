import * as text from "../../../../kit/text.js";

/** Where a manual redemption agreement is in its life cycle. */
export type ManualRedemptionAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One manual redemption agreement, with what the planners need to act on it. */
export class ManualRedemptionAgreement {
  code: string;
  label: string;
  sequence: number;
  conversionRate: number;
  locale: string;
  status: ManualRedemptionAgreementStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    conversionRate: number,
    locale: string,
    status: ManualRedemptionAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.conversionRate = conversionRate;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualRedemptionAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualRedemptionAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual redemption agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"manual redemption agreement"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.sequence - this.conversionRate) * 100) / 100;
  }

  copy(): ManualRedemptionAgreement {
    return new ManualRedemptionAgreement(
      this.code,
      this.label,
      this.sequence,
      this.conversionRate,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual redemption agreement in status idle. */
export function newManualRedemptionAgreement(code: string, label: string): ManualRedemptionAgreement {
  return new ManualRedemptionAgreement(code, label, 0, 0, "", "idle");
}
