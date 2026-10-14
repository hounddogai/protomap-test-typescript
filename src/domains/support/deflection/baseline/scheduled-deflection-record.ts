import * as text from "../../../../kit/text.js";

/** Where a scheduled deflection record is in its life cycle. */
export type ScheduledDeflectionRecordStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One scheduled deflection record, with what the planners need to act on it. */
export class ScheduledDeflectionRecord {
  code: string;
  label: string;
  updatedAt: number;
  rate: number;
  summary: string;
  archived: boolean;
  visible: boolean;
  conversionRate: number;
  retries: number;
  endsAt: number;
  status: ScheduledDeflectionRecordStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    rate: number,
    summary: string,
    archived: boolean,
    visible: boolean,
    conversionRate: number,
    retries: number,
    endsAt: number,
    status: ScheduledDeflectionRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.rate = rate;
    this.summary = summary;
    this.archived = archived;
    this.visible = visible;
    this.conversionRate = conversionRate;
    this.retries = retries;
    this.endsAt = endsAt;
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

  canMoveTo(next: ScheduledDeflectionRecordStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledDeflectionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled deflection record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"scheduled deflection record"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.endsAt * this.retries * 100) / 100;
  }

  copy(): ScheduledDeflectionRecord {
    return new ScheduledDeflectionRecord(
      this.code,
      this.label,
      this.updatedAt,
      this.rate,
      this.summary,
      this.archived,
      this.visible,
      this.conversionRate,
      this.retries,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled deflection record in status open. */
export function newScheduledDeflectionRecord(code: string, label: string): ScheduledDeflectionRecord {
  return new ScheduledDeflectionRecord(code, label, 0, 0, "", false, false, 0, 0, 0, "open");
}
