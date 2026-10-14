import * as text from "../../../../kit/text.js";

/** Where a csat agreement is in its life cycle. */
export type CsatAgreementStatus = "requested" | "granted" | "revoked" | "expired";

/** A csat agreement as the csat team keeps it. */
export class CsatAgreement {
  code: string;
  label: string;
  ceiling: number;
  timezone: string;
  clicks: number;
  impressions: number;
  budget: number;
  title: string;
  status: CsatAgreementStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    timezone: string,
    clicks: number,
    impressions: number,
    budget: number,
    title: string,
    status: CsatAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.timezone = timezone;
    this.clicks = clicks;
    this.impressions = impressions;
    this.budget = budget;
    this.title = title;
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

  canMoveTo(next: CsatAgreementStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
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

  moveTo(next: CsatAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"csat agreement"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.impressions - this.clicks) * 100) / 100;
  }

  copy(): CsatAgreement {
    return new CsatAgreement(
      this.code,
      this.label,
      this.ceiling,
      this.timezone,
      this.clicks,
      this.impressions,
      this.budget,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a csat agreement in status requested. */
export function newCsatAgreement(code: string, label: string): CsatAgreement {
  return new CsatAgreement(code, label, 0, "", 0, 0, 0, "", "requested");
}
