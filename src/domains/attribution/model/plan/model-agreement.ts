import * as text from "../../../../kit/text.js";

/** Where a model agreement is in its life cycle. */
export type ModelAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a model agreement and its current status. */
export class ModelAgreement {
  code: string;
  title: string;
  campaignRef: string;
  openRate: number;
  locale: string;
  phone: string;
  channel: string;
  margin: number;
  status: ModelAgreementStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    openRate: number,
    locale: string,
    phone: string,
    channel: string,
    margin: number,
    status: ModelAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.openRate = openRate;
    this.locale = locale;
    this.phone = phone;
    this.channel = channel;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ModelAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ModelAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"model agreement"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.openRate - this.margin) * 100) / 100;
  }

  copy(): ModelAgreement {
    return new ModelAgreement(
      this.code,
      this.title,
      this.campaignRef,
      this.openRate,
      this.locale,
      this.phone,
      this.channel,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a model agreement in status open. */
export function newModelAgreement(code: string, title: string): ModelAgreement {
  return new ModelAgreement(code, title, "", 0, "", "", "", 0, "open");
}
