import * as text from "../../../../kit/text.js";

/** Where a seasonal window audit is in its life cycle. */
export type SeasonalWindowAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A seasonal window audit as the window team keeps it. */
export class SeasonalWindowAudit {
  code: string;
  name: string;
  title: string;
  conversionRate: number;
  archived: boolean;
  segment: string;
  externalRef: string;
  approved: boolean;
  status: SeasonalWindowAuditStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    conversionRate: number,
    archived: boolean,
    segment: string,
    externalRef: string,
    approved: boolean,
    status: SeasonalWindowAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.conversionRate = conversionRate;
    this.archived = archived;
    this.segment = segment;
    this.externalRef = externalRef;
    this.approved = approved;
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

  canMoveTo(next: SeasonalWindowAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalWindowAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal window audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): SeasonalWindowAudit {
    return new SeasonalWindowAudit(
      this.code,
      this.name,
      this.title,
      this.conversionRate,
      this.archived,
      this.segment,
      this.externalRef,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a seasonal window audit in status planned. */
export function newSeasonalWindowAudit(code: string, name: string): SeasonalWindowAudit {
  return new SeasonalWindowAudit(code, name, "", 0, false, "", "", false, "planned");
}
