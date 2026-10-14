import * as text from "../../../../kit/text.js";

/** Where a default touchpoint record is in its life cycle. */
export type DefaultTouchpointRecordStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One default touchpoint record, with what the planners need to act on it. */
export class DefaultTouchpointRecord {
  code: string;
  title: string;
  locale: string;
  priority: number;
  retries: number;
  label: string;
  ownerId: string;
  active: boolean;
  conversionRate: number;
  expiresAt: number;
  status: DefaultTouchpointRecordStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    priority: number,
    retries: number,
    label: string,
    ownerId: string,
    active: boolean,
    conversionRate: number,
    expiresAt: number,
    status: DefaultTouchpointRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.priority = priority;
    this.retries = retries;
    this.label = label;
    this.ownerId = ownerId;
    this.active = active;
    this.conversionRate = conversionRate;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: DefaultTouchpointRecordStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultTouchpointRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default touchpoint record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"default touchpoint record"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.conversionRate * this.retries * 100) / 100;
  }

  copy(): DefaultTouchpointRecord {
    return new DefaultTouchpointRecord(
      this.code,
      this.title,
      this.locale,
      this.priority,
      this.retries,
      this.label,
      this.ownerId,
      this.active,
      this.conversionRate,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default touchpoint record in status proposed. */
export function newDefaultTouchpointRecord(code: string, title: string): DefaultTouchpointRecord {
  return new DefaultTouchpointRecord(code, title, "", 0, 0, "", "", false, 0, 0, "proposed");
}
