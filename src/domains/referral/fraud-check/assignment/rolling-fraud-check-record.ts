import * as text from "../../../../kit/text.js";

/** Where a rolling fraud check record is in its life cycle. */
export type RollingFraudCheckRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a rolling fraud check record and its current status. */
export class RollingFraudCheckRecord {
  code: string;
  title: string;
  locale: string;
  attributes: Map<string, string>;
  archived: boolean;
  startsAt: number;
  status: RollingFraudCheckRecordStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    attributes: Map<string, string>,
    archived: boolean,
    startsAt: number,
    status: RollingFraudCheckRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.attributes = attributes;
    this.archived = archived;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingFraudCheckRecordStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RollingFraudCheckRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling fraud check record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): RollingFraudCheckRecord {
    return new RollingFraudCheckRecord(
      this.code,
      this.title,
      this.locale,
      this.attributes,
      this.archived,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling fraud check record in status requested. */
export function newRollingFraudCheckRecord(code: string, title: string): RollingFraudCheckRecord {
  return new RollingFraudCheckRecord(code, title, "", new Map<string, string>(), false, 0, "requested");
}
