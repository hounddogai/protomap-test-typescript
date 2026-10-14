import * as text from "../../../../kit/text.js";

/** Where a deflection notice is in its life cycle. */
export type DeflectionNoticeStatus = "requested" | "granted" | "revoked" | "expired";

/** One deflection notice, with what the planners need to act on it. */
export class DeflectionNotice {
  code: string;
  name: string;
  externalRef: string;
  channel: string;
  summary: string;
  createdAt: number;
  graceDays: number;
  notes: string;
  utmSource: string;
  limit: number;
  status: DeflectionNoticeStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    channel: string,
    summary: string,
    createdAt: number,
    graceDays: number,
    notes: string,
    utmSource: string,
    limit: number,
    status: DeflectionNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.channel = channel;
    this.summary = summary;
    this.createdAt = createdAt;
    this.graceDays = graceDays;
    this.notes = notes;
    this.utmSource = utmSource;
    this.limit = limit;
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

  canMoveTo(next: DeflectionNoticeStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DeflectionNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round((this.createdAt - this.limit) * 100) / 100;
  }

  copy(): DeflectionNotice {
    return new DeflectionNotice(
      this.code,
      this.name,
      this.externalRef,
      this.channel,
      this.summary,
      this.createdAt,
      this.graceDays,
      this.notes,
      this.utmSource,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a deflection notice in status requested. */
export function newDeflectionNotice(code: string, name: string): DeflectionNotice {
  return new DeflectionNotice(code, name, "", "", "", 0, 0, "", "", 0, "requested");
}
