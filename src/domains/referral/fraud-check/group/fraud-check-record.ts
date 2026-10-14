import * as text from "../../../../kit/text.js";

/** Where a fraud check record is in its life cycle. */
export type FraudCheckRecordStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a fraud check record and its current status. */
export class FraudCheckRecord {
  code: string;
  title: string;
  openRate: number;
  locale: string;
  campaignRef: string;
  status: FraudCheckRecordStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    locale: string,
    campaignRef: string,
    status: FraudCheckRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.locale = locale;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: FraudCheckRecordStatus): boolean {
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

  moveTo(next: FraudCheckRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): FraudCheckRecord {
    return new FraudCheckRecord(this.code, this.title, this.openRate, this.locale, this.campaignRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fraud check record in status proposed. */
export function newFraudCheckRecord(code: string, title: string): FraudCheckRecord {
  return new FraudCheckRecord(code, title, 0, "", "", "proposed");
}
