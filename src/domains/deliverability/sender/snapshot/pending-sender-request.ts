import * as text from "../../../../kit/text.js";

/** Where a pending sender request is in its life cycle. */
export type PendingSenderRequestStatus = "created" | "validated" | "published" | "retired";

/** A pending sender request. Its code is unique within a tenant. */
export class PendingSenderRequest {
  code: string;
  title: string;
  limit: number;
  endsAt: number;
  discount: number;
  cost: number;
  status: PendingSenderRequestStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    endsAt: number,
    discount: number,
    cost: number,
    status: PendingSenderRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.endsAt = endsAt;
    this.discount = discount;
    this.cost = cost;
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

  canMoveTo(next: PendingSenderRequestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingSenderRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending sender request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pending sender request"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.endsAt + this.limit) * 100) / 100;
  }

  copy(): PendingSenderRequest {
    return new PendingSenderRequest(
      this.code,
      this.title,
      this.limit,
      this.endsAt,
      this.discount,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending sender request in status created. */
export function newPendingSenderRequest(code: string, title: string): PendingSenderRequest {
  return new PendingSenderRequest(code, title, 0, 0, 0, 0, "created");
}
