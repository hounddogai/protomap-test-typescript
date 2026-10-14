import * as text from "../../../../kit/text.js";

/** Where a tiered csat mapping is in its life cycle. */
export type TieredCsatMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a tiered csat mapping and its current status. */
export class TieredCsatMapping {
  code: string;
  title: string;
  revision: number;
  externalRef: string;
  maximum: number;
  label: string;
  budget: number;
  updatedAt: number;
  status: TieredCsatMappingStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    externalRef: string,
    maximum: number,
    label: string,
    budget: number,
    updatedAt: number,
    status: TieredCsatMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.externalRef = externalRef;
    this.maximum = maximum;
    this.label = label;
    this.budget = budget;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: TieredCsatMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: TieredCsatMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered csat mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedExposure(): number {
    return Math.round(this.revision * this.maximum * 100) / 100;
  }

  copy(): TieredCsatMapping {
    return new TieredCsatMapping(
      this.code,
      this.title,
      this.revision,
      this.externalRef,
      this.maximum,
      this.label,
      this.budget,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered csat mapping in status proposed. */
export function newTieredCsatMapping(code: string, title: string): TieredCsatMapping {
  return new TieredCsatMapping(code, title, 0, "", 0, "", 0, 0, "proposed");
}
