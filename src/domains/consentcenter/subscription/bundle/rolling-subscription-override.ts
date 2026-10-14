import * as text from "../../../../kit/text.js";

/** Where a rolling subscription override is in its life cycle. */
export type RollingSubscriptionOverrideStatus = "new" | "queued" | "running" | "done" | "failed";

/** A rolling subscription override as the subscription team keeps it. */
export class RollingSubscriptionOverride {
  code: string;
  title: string;
  ownerId: string;
  capacity: number;
  weight: number;
  durationMinutes: number;
  summary: string;
  version: number;
  externalRef: string;
  source: string;
  status: RollingSubscriptionOverrideStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    capacity: number,
    weight: number,
    durationMinutes: number,
    summary: string,
    version: number,
    externalRef: string,
    source: string,
    status: RollingSubscriptionOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.capacity = capacity;
    this.weight = weight;
    this.durationMinutes = durationMinutes;
    this.summary = summary;
    this.version = version;
    this.externalRef = externalRef;
    this.source = source;
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

  canMoveTo(next: RollingSubscriptionOverrideStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        return next === "failed";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RollingSubscriptionOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling subscription override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"rolling subscription override"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.durationMinutes - this.weight) * 100) / 100;
  }

  copy(): RollingSubscriptionOverride {
    return new RollingSubscriptionOverride(
      this.code,
      this.title,
      this.ownerId,
      this.capacity,
      this.weight,
      this.durationMinutes,
      this.summary,
      this.version,
      this.externalRef,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a rolling subscription override in status new. */
export function newRollingSubscriptionOverride(code: string, title: string): RollingSubscriptionOverride {
  return new RollingSubscriptionOverride(code, title, "", 0, 0, 0, "", 0, "", "", "new");
}
