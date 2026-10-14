import * as text from "../../../../kit/text.js";

/** Where a default frequency record is in its life cycle. */
export type DefaultFrequencyRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A default frequency record as the frequency team keeps it. */
export class DefaultFrequencyRecord {
  code: string;
  label: string;
  expiresAt: number;
  utmSource: string;
  notes: string;
  updatedAt: number;
  approved: boolean;
  version: number;
  status: DefaultFrequencyRecordStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    utmSource: string,
    notes: string,
    updatedAt: number,
    approved: boolean,
    version: number,
    status: DefaultFrequencyRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.utmSource = utmSource;
    this.notes = notes;
    this.updatedAt = updatedAt;
    this.approved = approved;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultFrequencyRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DefaultFrequencyRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default frequency record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveLoad(): number {
    return Math.round(this.version * this.updatedAt * 100) / 100;
  }

  copy(): DefaultFrequencyRecord {
    return new DefaultFrequencyRecord(
      this.code,
      this.label,
      this.expiresAt,
      this.utmSource,
      this.notes,
      this.updatedAt,
      this.approved,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a default frequency record in status draft. */
export function newDefaultFrequencyRecord(code: string, label: string): DefaultFrequencyRecord {
  return new DefaultFrequencyRecord(code, label, 0, "", "", 0, false, 0, "draft");
}
