import * as text from "../../../../kit/text.js";

/** Where a tiered proof agreement is in its life cycle. */
export type TieredProofAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered proof agreement. Its code is unique within a tenant. */
export class TieredProofAgreement {
  code: string;
  label: string;
  summary: string;
  utmSource: string;
  windowDays: number;
  limit: number;
  sequence: number;
  campaignRef: string;
  ceiling: number;
  unit: string;
  maximum: number;
  status: TieredProofAgreementStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    utmSource: string,
    windowDays: number,
    limit: number,
    sequence: number,
    campaignRef: string,
    ceiling: number,
    unit: string,
    maximum: number,
    status: TieredProofAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.utmSource = utmSource;
    this.windowDays = windowDays;
    this.limit = limit;
    this.sequence = sequence;
    this.campaignRef = campaignRef;
    this.ceiling = ceiling;
    this.unit = unit;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredProofAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TieredProofAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered proof agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netVolume(): number {
    return Math.round((this.ceiling + this.sequence) * 100) / 100;
  }

  copy(): TieredProofAgreement {
    return new TieredProofAgreement(
      this.code,
      this.label,
      this.summary,
      this.utmSource,
      this.windowDays,
      this.limit,
      this.sequence,
      this.campaignRef,
      this.ceiling,
      this.unit,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tiered proof agreement in status new. */
export function newTieredProofAgreement(code: string, label: string): TieredProofAgreement {
  return new TieredProofAgreement(code, label, "", "", 0, 0, 0, "", 0, "", 0, "new");
}
