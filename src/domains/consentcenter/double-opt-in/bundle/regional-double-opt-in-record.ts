import * as text from "../../../../kit/text.js";

/** Where a regional double opt in record is in its life cycle. */
export type RegionalDoubleOptInRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** A regional double opt in record. Its code is unique within a tenant. */
export class RegionalDoubleOptInRecord {
  code: string;
  title: string;
  label: string;
  budget: number;
  updatedAt: number;
  createdAt: number;
  clicks: number;
  ceiling: number;
  visible: boolean;
  reviewer: string;
  status: RegionalDoubleOptInRecordStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    budget: number,
    updatedAt: number,
    createdAt: number,
    clicks: number,
    ceiling: number,
    visible: boolean,
    reviewer: string,
    status: RegionalDoubleOptInRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.createdAt = createdAt;
    this.clicks = clicks;
    this.ceiling = ceiling;
    this.visible = visible;
    this.reviewer = reviewer;
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

  canMoveTo(next: RegionalDoubleOptInRecordStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalDoubleOptInRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional double opt in record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.budget + this.clicks) * 100) / 100;
  }

  copy(): RegionalDoubleOptInRecord {
    return new RegionalDoubleOptInRecord(
      this.code,
      this.title,
      this.label,
      this.budget,
      this.updatedAt,
      this.createdAt,
      this.clicks,
      this.ceiling,
      this.visible,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional double opt in record in status requested. */
export function newRegionalDoubleOptInRecord(code: string, title: string): RegionalDoubleOptInRecord {
  return new RegionalDoubleOptInRecord(code, title, "", 0, 0, 0, 0, 0, false, "", "requested");
}
