import * as text from "../../../../kit/text.js";

/** Where a csat record is in its life cycle. */
export type CsatRecordStatus = "created" | "validated" | "published" | "retired";

/** A csat record. Its code is unique within a tenant. */
export class CsatRecord {
  code: string;
  title: string;
  utmSource: string;
  reviewer: string;
  openRate: number;
  visible: boolean;
  region: string;
  status: CsatRecordStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    reviewer: string,
    openRate: number,
    visible: boolean,
    region: string,
    status: CsatRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.reviewer = reviewer;
    this.openRate = openRate;
    this.visible = visible;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CsatRecordStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): CsatRecord {
    return new CsatRecord(
      this.code,
      this.title,
      this.utmSource,
      this.reviewer,
      this.openRate,
      this.visible,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a csat record in status created. */
export function newCsatRecord(code: string, title: string): CsatRecord {
  return new CsatRecord(code, title, "", "", 0, false, "", "created");
}
