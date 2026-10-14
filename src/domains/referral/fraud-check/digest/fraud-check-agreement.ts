import * as text from "../../../../kit/text.js";

/** Where a fraud check agreement is in its life cycle. */
export type FraudCheckAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One fraud check agreement, with what the planners need to act on it. */
export class FraudCheckAgreement {
  code: string;
  label: string;
  endsAt: number;
  category: string;
  summary: string;
  margin: number;
  graceDays: number;
  phone: string;
  status: FraudCheckAgreementStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    category: string,
    summary: string,
    margin: number,
    graceDays: number,
    phone: string,
    status: FraudCheckAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.category = category;
    this.summary = summary;
    this.margin = margin;
    this.graceDays = graceDays;
    this.phone = phone;
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

  canMoveTo(next: FraudCheckAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "draining":
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

  moveTo(next: FraudCheckAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"fraud check agreement"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.margin + this.endsAt) * 100) / 100;
  }

  copy(): FraudCheckAgreement {
    return new FraudCheckAgreement(
      this.code,
      this.label,
      this.endsAt,
      this.category,
      this.summary,
      this.margin,
      this.graceDays,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fraud check agreement in status idle. */
export function newFraudCheckAgreement(code: string, label: string): FraudCheckAgreement {
  return new FraudCheckAgreement(code, label, 0, "", "", 0, 0, "", "idle");
}
