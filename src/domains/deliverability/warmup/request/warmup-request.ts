/**
 * The warmup request records of deliverability's warmup work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a warmup request is in its life cycle. */
export type WarmupRequestStatus = "created" | "validated" | "published" | "retired";

/** One warmup request, with what the planners need to act on it. */
export class WarmupRequest {
  code: string;
  label: string;
  revision: number;
  utmSource: string;
  ownerId: string;
  checksum: string;
  locale: string;
  notes: string;
  status: WarmupRequestStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    utmSource: string,
    ownerId: string,
    checksum: string,
    locale: string,
    notes: string,
    status: WarmupRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.utmSource = utmSource;
    this.ownerId = ownerId;
    this.checksum = checksum;
    this.locale = locale;
    this.notes = notes;
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

  canMoveTo(next: WarmupRequestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WarmupRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): WarmupRequest {
    return new WarmupRequest(
      this.code,
      this.label,
      this.revision,
      this.utmSource,
      this.ownerId,
      this.checksum,
      this.locale,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a warmup request in status created. */
export function newWarmupRequest(code: string, label: string): WarmupRequest {
  return new WarmupRequest(code, label, 0, "", "", "", "", "", "created");
}
