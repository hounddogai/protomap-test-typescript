import * as text from "../../../../kit/text.js";

/** Where a manual domain record is in its life cycle. */
export type ManualDomainRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A manual domain record as the domain team keeps it. */
export class ManualDomainRecord {
  code: string;
  name: string;
  graceDays: number;
  externalRef: string;
  unit: string;
  variant: string;
  status: ManualDomainRecordStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    externalRef: string,
    unit: string,
    variant: string,
    status: ManualDomainRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.externalRef = externalRef;
    this.unit = unit;
    this.variant = variant;
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

  canMoveTo(next: ManualDomainRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualDomainRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual domain record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): ManualDomainRecord {
    return new ManualDomainRecord(
      this.code,
      this.name,
      this.graceDays,
      this.externalRef,
      this.unit,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a manual domain record in status draft. */
export function newManualDomainRecord(code: string, name: string): ManualDomainRecord {
  return new ManualDomainRecord(code, name, 0, "", "", "", "draft");
}
