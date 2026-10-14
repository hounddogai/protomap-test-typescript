import * as text from "../../../../kit/text.js";

/** Where a rolling double opt in record is in its life cycle. */
export type RollingDoubleOptInRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One rolling double opt in record, with what the planners need to act on it. */
export class RollingDoubleOptInRecord {
  code: string;
  name: string;
  locale: string;
  quantity: number;
  updatedAt: number;
  maximum: number;
  attributes: Map<string, string>;
  pinned: boolean;
  description: string;
  contactEmail: string;
  status: RollingDoubleOptInRecordStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    quantity: number,
    updatedAt: number,
    maximum: number,
    attributes: Map<string, string>,
    pinned: boolean,
    description: string,
    contactEmail: string,
    status: RollingDoubleOptInRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.quantity = quantity;
    this.updatedAt = updatedAt;
    this.maximum = maximum;
    this.attributes = attributes;
    this.pinned = pinned;
    this.description = description;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: RollingDoubleOptInRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
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

  moveTo(next: RollingDoubleOptInRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling double opt in record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"rolling double opt in record"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveVolume(): number {
    return Math.round((this.quantity - this.updatedAt) * 100) / 100;
  }

  copy(): RollingDoubleOptInRecord {
    return new RollingDoubleOptInRecord(
      this.code,
      this.name,
      this.locale,
      this.quantity,
      this.updatedAt,
      this.maximum,
      this.attributes,
      this.pinned,
      this.description,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling double opt in record in status planned. */
export function newRollingDoubleOptInRecord(code: string, name: string): RollingDoubleOptInRecord {
  return new RollingDoubleOptInRecord(code, name, "", 0, 0, 0, new Map<string, string>(), false, "", "", "planned");
}
