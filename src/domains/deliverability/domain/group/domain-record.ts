import * as text from "../../../../kit/text.js";

/** Where a domain record is in its life cycle. */
export type DomainRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One domain record, with what the planners need to act on it. */
export class DomainRecord {
  code: string;
  label: string;
  variant: string;
  externalRef: string;
  openRate: number;
  floorValue: number;
  timezone: string;
  archived: boolean;
  attributes: Map<string, string>;
  source: string;
  status: DomainRecordStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    externalRef: string,
    openRate: number,
    floorValue: number,
    timezone: string,
    archived: boolean,
    attributes: Map<string, string>,
    source: string,
    status: DomainRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.externalRef = externalRef;
    this.openRate = openRate;
    this.floorValue = floorValue;
    this.timezone = timezone;
    this.archived = archived;
    this.attributes = attributes;
    this.source = source;
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

  canMoveTo(next: DomainRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedValue(): number {
    return Math.round(this.floorValue * this.openRate * 100) / 100;
  }

  copy(): DomainRecord {
    return new DomainRecord(
      this.code,
      this.label,
      this.variant,
      this.externalRef,
      this.openRate,
      this.floorValue,
      this.timezone,
      this.archived,
      this.attributes,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a domain record in status planned. */
export function newDomainRecord(code: string, label: string): DomainRecord {
  return new DomainRecord(code, label, "", "", 0, 0, "", false, new Map<string, string>(), "", "planned");
}
