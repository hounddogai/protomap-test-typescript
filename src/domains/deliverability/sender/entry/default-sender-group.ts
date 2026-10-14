import * as text from "../../../../kit/text.js";

/** Where a default sender group is in its life cycle. */
export type DefaultSenderGroupStatus = "new" | "queued" | "running" | "done" | "failed";

/** A default sender group as the sender team keeps it. */
export class DefaultSenderGroup {
  code: string;
  title: string;
  limit: number;
  approved: boolean;
  openRate: number;
  updatedAt: number;
  status: DefaultSenderGroupStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    approved: boolean,
    openRate: number,
    updatedAt: number,
    status: DefaultSenderGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.approved = approved;
    this.openRate = openRate;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: DefaultSenderGroupStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: DefaultSenderGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default sender group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedExposure(): number {
    return Math.round(this.limit * this.updatedAt * 100) / 100;
  }

  copy(): DefaultSenderGroup {
    return new DefaultSenderGroup(
      this.code,
      this.title,
      this.limit,
      this.approved,
      this.openRate,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default sender group in status new. */
export function newDefaultSenderGroup(code: string, title: string): DefaultSenderGroup {
  return new DefaultSenderGroup(code, title, 0, false, 0, 0, "new");
}
