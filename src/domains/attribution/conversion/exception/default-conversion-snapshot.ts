import * as text from "../../../../kit/text.js";

/** Where a default conversion snapshot is in its life cycle. */
export type DefaultConversionSnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A default conversion snapshot. Its code is unique within a tenant. */
export class DefaultConversionSnapshot {
  code: string;
  name: string;
  approved: boolean;
  createdAt: number;
  batchSize: number;
  channel: string;
  variant: string;
  limit: number;
  graceDays: number;
  status: DefaultConversionSnapshotStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    createdAt: number,
    batchSize: number,
    channel: string,
    variant: string,
    limit: number,
    graceDays: number,
    status: DefaultConversionSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.createdAt = createdAt;
    this.batchSize = batchSize;
    this.channel = channel;
    this.variant = variant;
    this.limit = limit;
    this.graceDays = graceDays;
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

  canMoveTo(next: DefaultConversionSnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultConversionSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default conversion snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.graceDays + this.batchSize) * 100) / 100;
  }

  copy(): DefaultConversionSnapshot {
    return new DefaultConversionSnapshot(
      this.code,
      this.name,
      this.approved,
      this.createdAt,
      this.batchSize,
      this.channel,
      this.variant,
      this.limit,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default conversion snapshot in status proposed. */
export function newDefaultConversionSnapshot(code: string, name: string): DefaultConversionSnapshot {
  return new DefaultConversionSnapshot(code, name, false, 0, 0, "", "", 0, 0, "proposed");
}
