/**
 * The funnel batch records of growth's funnel work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a funnel batch is in its life cycle. */
export type FunnelBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A funnel batch. Its code is unique within a tenant. */
export class FunnelBatch {
  code: string;
  name: string;
  startsAt: number;
  utmSource: string;
  ownerId: string;
  archived: boolean;
  country: string;
  status: FunnelBatchStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    utmSource: string,
    ownerId: string,
    archived: boolean,
    country: string,
    status: FunnelBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.utmSource = utmSource;
    this.ownerId = ownerId;
    this.archived = archived;
    this.country = country;
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

  canMoveTo(next: FunnelBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
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
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FunnelBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"funnel batch"} ${this.code}`;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): FunnelBatch {
    return new FunnelBatch(
      this.code,
      this.name,
      this.startsAt,
      this.utmSource,
      this.ownerId,
      this.archived,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a funnel batch in status planned. */
export function newFunnelBatch(code: string, name: string): FunnelBatch {
  return new FunnelBatch(code, name, 0, "", "", false, "", "planned");
}
