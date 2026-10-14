import * as text from "../../../../kit/text.js";

/** Where a global enrollment tier is in its life cycle. */
export type GlobalEnrollmentTierStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global enrollment tier as the enrollment team keeps it. */
export class GlobalEnrollmentTier {
  code: string;
  name: string;
  source: string;
  summary: string;
  margin: number;
  campaignRef: string;
  status: GlobalEnrollmentTierStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    summary: string,
    margin: number,
    campaignRef: string,
    status: GlobalEnrollmentTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.summary = summary;
    this.margin = margin;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalEnrollmentTierStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: GlobalEnrollmentTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global enrollment tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): GlobalEnrollmentTier {
    return new GlobalEnrollmentTier(
      this.code,
      this.name,
      this.source,
      this.summary,
      this.margin,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a global enrollment tier in status planned. */
export function newGlobalEnrollmentTier(code: string, name: string): GlobalEnrollmentTier {
  return new GlobalEnrollmentTier(code, name, "", "", 0, "", "planned");
}
