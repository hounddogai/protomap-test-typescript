import * as text from "../../../../kit/text.js";

/** Where a creative audit is in its life cycle. */
export type CreativeAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a creative audit and its current status. */
export class CreativeAudit {
  code: string;
  label: string;
  windowDays: number;
  visible: boolean;
  title: string;
  phone: string;
  retries: number;
  region: string;
  currency: string;
  segment: string;
  reviewer: string;
  status: CreativeAuditStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    visible: boolean,
    title: string,
    phone: string,
    retries: number,
    region: string,
    currency: string,
    segment: string,
    reviewer: string,
    status: CreativeAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.visible = visible;
    this.title = title;
    this.phone = phone;
    this.retries = retries;
    this.region = region;
    this.currency = currency;
    this.segment = segment;
    this.reviewer = reviewer;
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

  canMoveTo(next: CreativeAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
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

  moveTo(next: CreativeAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round(this.retries * this.windowDays * 100) / 100;
  }

  copy(): CreativeAudit {
    return new CreativeAudit(
      this.code,
      this.label,
      this.windowDays,
      this.visible,
      this.title,
      this.phone,
      this.retries,
      this.region,
      this.currency,
      this.segment,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a creative audit in status proposed. */
export function newCreativeAudit(code: string, label: string): CreativeAudit {
  return new CreativeAudit(code, label, 0, false, "", "", 0, "", "", "", "", "proposed");
}
