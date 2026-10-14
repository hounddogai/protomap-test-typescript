import * as text from "../../../../kit/text.js";

/** Where a pending subscription snapshot is in its life cycle. */
export type PendingSubscriptionSnapshotStatus = "new" | "queued" | "running" | "done" | "failed";

/** A pending subscription snapshot as the subscription team keeps it. */
export class PendingSubscriptionSnapshot {
  code: string;
  title: string;
  summary: string;
  name: string;
  budget: number;
  status: PendingSubscriptionSnapshotStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    name: string,
    budget: number,
    status: PendingSubscriptionSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.name = name;
    this.budget = budget;
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

  canMoveTo(next: PendingSubscriptionSnapshotStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingSubscriptionSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending subscription snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): PendingSubscriptionSnapshot {
    return new PendingSubscriptionSnapshot(this.code, this.title, this.summary, this.name, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending subscription snapshot in status new. */
export function newPendingSubscriptionSnapshot(code: string, title: string): PendingSubscriptionSnapshot {
  return new PendingSubscriptionSnapshot(code, title, "", "", 0, "new");
}
