import * as text from "../../../../kit/text.js";

/** Where a rolling payout batch is in its life cycle. */
export type RollingPayoutBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a rolling payout batch and its current status. */
export class RollingPayoutBatch {
  code: string;
  name: string;
  visible: boolean;
  endsAt: number;
  checksum: string;
  tags: string[];
  status: RollingPayoutBatchStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    endsAt: number,
    checksum: string,
    tags: string[],
    status: RollingPayoutBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.endsAt = endsAt;
    this.checksum = checksum;
    this.tags = tags;
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

  canMoveTo(next: RollingPayoutBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingPayoutBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling payout batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"rolling payout batch"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): RollingPayoutBatch {
    return new RollingPayoutBatch(
      this.code,
      this.name,
      this.visible,
      this.endsAt,
      this.checksum,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling payout batch in status requested. */
export function newRollingPayoutBatch(code: string, name: string): RollingPayoutBatch {
  return new RollingPayoutBatch(code, name, false, 0, "", [], "requested");
}
