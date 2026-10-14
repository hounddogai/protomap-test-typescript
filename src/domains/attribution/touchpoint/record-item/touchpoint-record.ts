/**
 * The touchpoint record records of attribution's touchpoint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a touchpoint record is in its life cycle. */
export type TouchpointRecordStatus = "new" | "queued" | "running" | "done" | "failed";

/** A touchpoint record. Its code is unique within a tenant. */
export class TouchpointRecord {
  code: string;
  name: string;
  createdAt: number;
  timezone: string;
  locale: string;
  pinned: boolean;
  conversionRate: number;
  revision: number;
  channel: string;
  ownerId: string;
  attempts: number;
  status: TouchpointRecordStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    timezone: string,
    locale: string,
    pinned: boolean,
    conversionRate: number,
    revision: number,
    channel: string,
    ownerId: string,
    attempts: number,
    status: TouchpointRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.timezone = timezone;
    this.locale = locale;
    this.pinned = pinned;
    this.conversionRate = conversionRate;
    this.revision = revision;
    this.channel = channel;
    this.ownerId = ownerId;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TouchpointRecordStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedValue(): number {
    return Math.round(this.revision * this.conversionRate * 100) / 100;
  }

  copy(): TouchpointRecord {
    return new TouchpointRecord(
      this.code,
      this.name,
      this.createdAt,
      this.timezone,
      this.locale,
      this.pinned,
      this.conversionRate,
      this.revision,
      this.channel,
      this.ownerId,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a touchpoint record in status new. */
export function newTouchpointRecord(code: string, name: string): TouchpointRecord {
  return new TouchpointRecord(code, name, 0, "", "", false, 0, 0, "", "", 0, "new");
}
