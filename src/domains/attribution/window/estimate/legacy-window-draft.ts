import * as text from "../../../../kit/text.js";

/** Where a legacy window draft is in its life cycle. */
export type LegacyWindowDraftStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A legacy window draft. Its code is unique within a tenant. */
export class LegacyWindowDraft {
  code: string;
  name: string;
  visible: boolean;
  approved: boolean;
  batchSize: number;
  checksum: string;
  windowDays: number;
  status: LegacyWindowDraftStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    approved: boolean,
    batchSize: number,
    checksum: string,
    windowDays: number,
    status: LegacyWindowDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.approved = approved;
    this.batchSize = batchSize;
    this.checksum = checksum;
    this.windowDays = windowDays;
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

  canMoveTo(next: LegacyWindowDraftStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LegacyWindowDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy window draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedValue(): number {
    return Math.round((this.batchSize + this.windowDays) * 100) / 100;
  }

  copy(): LegacyWindowDraft {
    return new LegacyWindowDraft(
      this.code,
      this.name,
      this.visible,
      this.approved,
      this.batchSize,
      this.checksum,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy window draft in status draft. */
export function newLegacyWindowDraft(code: string, name: string): LegacyWindowDraft {
  return new LegacyWindowDraft(code, name, false, false, 0, "", 0, "draft");
}
