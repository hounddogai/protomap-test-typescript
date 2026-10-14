import * as text from "../../../../kit/text.js";

/** Where a tiered complaint bundle is in its life cycle. */
export type TieredComplaintBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A tiered complaint bundle. Its code is unique within a tenant. */
export class TieredComplaintBundle {
  code: string;
  name: string;
  channel: string;
  tags: string[];
  checksum: string;
  amount: number;
  status: TieredComplaintBundleStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    tags: string[],
    checksum: string,
    amount: number,
    status: TieredComplaintBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.tags = tags;
    this.checksum = checksum;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredComplaintBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredComplaintBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered complaint bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered complaint bundle"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): TieredComplaintBundle {
    return new TieredComplaintBundle(
      this.code,
      this.name,
      this.channel,
      this.tags,
      this.checksum,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered complaint bundle in status draft. */
export function newTieredComplaintBundle(code: string, name: string): TieredComplaintBundle {
  return new TieredComplaintBundle(code, name, "", [], "", 0, "draft");
}
