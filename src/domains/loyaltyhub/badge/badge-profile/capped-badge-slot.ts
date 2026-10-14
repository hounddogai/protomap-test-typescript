import * as text from "../../../../kit/text.js";

/** Where a capped badge slot is in its life cycle. */
export type CappedBadgeSlotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A capped badge slot. Its code is unique within a tenant. */
export class CappedBadgeSlot {
  code: string;
  title: string;
  name: string;
  utmSource: string;
  version: number;
  visible: boolean;
  endsAt: number;
  status: CappedBadgeSlotStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    utmSource: string,
    version: number,
    visible: boolean,
    endsAt: number,
    status: CappedBadgeSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.utmSource = utmSource;
    this.version = version;
    this.visible = visible;
    this.endsAt = endsAt;
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

  canMoveTo(next: CappedBadgeSlotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CappedBadgeSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped badge slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"capped badge slot"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.endsAt * this.version * 100) / 100;
  }

  copy(): CappedBadgeSlot {
    return new CappedBadgeSlot(
      this.code,
      this.title,
      this.name,
      this.utmSource,
      this.version,
      this.visible,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a capped badge slot in status draft. */
export function newCappedBadgeSlot(code: string, title: string): CappedBadgeSlot {
  return new CappedBadgeSlot(code, title, "", "", 0, false, 0, "draft");
}
