import * as text from "../../../../kit/text.js";

/** Where a macro cycle is in its life cycle. */
export type MacroCycleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A macro cycle. Its code is unique within a tenant. */
export class MacroCycle {
  code: string;
  label: string;
  conversionRate: number;
  variant: string;
  limit: number;
  updatedAt: number;
  summary: string;
  journeyId: string;
  title: string;
  version: number;
  status: MacroCycleStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    variant: string,
    limit: number,
    updatedAt: number,
    summary: string,
    journeyId: string,
    title: string,
    version: number,
    status: MacroCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.variant = variant;
    this.limit = limit;
    this.updatedAt = updatedAt;
    this.summary = summary;
    this.journeyId = journeyId;
    this.title = title;
    this.version = version;
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

  canMoveTo(next: MacroCycleStatus): boolean {
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
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: MacroCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"macro cycle"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.updatedAt * this.limit * 100) / 100;
  }

  copy(): MacroCycle {
    return new MacroCycle(
      this.code,
      this.label,
      this.conversionRate,
      this.variant,
      this.limit,
      this.updatedAt,
      this.summary,
      this.journeyId,
      this.title,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a macro cycle in status proposed. */
export function newMacroCycle(code: string, label: string): MacroCycle {
  return new MacroCycle(code, label, 0, "", 0, 0, "", "", "", 0, "proposed");
}
