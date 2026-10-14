import * as text from "../../../../kit/text.js";

/** Where a activation audit is in its life cycle. */
export type ActivationAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One activation audit, with what the planners need to act on it. */
export class ActivationAudit {
  code: string;
  title: string;
  variant: string;
  retries: number;
  windowDays: number;
  currency: string;
  contactEmail: string;
  audienceId: string;
  margin: number;
  status: ActivationAuditStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    retries: number,
    windowDays: number,
    currency: string,
    contactEmail: string,
    audienceId: string,
    margin: number,
    status: ActivationAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.retries = retries;
    this.windowDays = windowDays;
    this.currency = currency;
    this.contactEmail = contactEmail;
    this.audienceId = audienceId;
    this.margin = margin;
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

  canMoveTo(next: ActivationAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ActivationAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round(this.retries * this.windowDays * 100) / 100;
  }

  copy(): ActivationAudit {
    return new ActivationAudit(
      this.code,
      this.title,
      this.variant,
      this.retries,
      this.windowDays,
      this.currency,
      this.contactEmail,
      this.audienceId,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a activation audit in status proposed. */
export function newActivationAudit(code: string, title: string): ActivationAudit {
  return new ActivationAudit(code, title, "", 0, 0, "", "", "", 0, "proposed");
}
