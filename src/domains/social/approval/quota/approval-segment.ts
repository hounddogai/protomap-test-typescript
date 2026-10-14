import * as text from "../../../../kit/text.js";

/** Where a approval segment is in its life cycle. */
export type ApprovalSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A approval segment as the approval team keeps it. */
export class ApprovalSegment {
  code: string;
  name: string;
  ceiling: number;
  category: string;
  revision: number;
  locale: string;
  notes: string;
  quantity: number;
  status: ApprovalSegmentStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    category: string,
    revision: number,
    locale: string,
    notes: string,
    quantity: number,
    status: ApprovalSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.category = category;
    this.revision = revision;
    this.locale = locale;
    this.notes = notes;
    this.quantity = quantity;
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

  canMoveTo(next: ApprovalSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
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

  moveTo(next: ApprovalSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"approval segment"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round(this.quantity * this.revision * 100) / 100;
  }

  copy(): ApprovalSegment {
    return new ApprovalSegment(
      this.code,
      this.name,
      this.ceiling,
      this.category,
      this.revision,
      this.locale,
      this.notes,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a approval segment in status requested. */
export function newApprovalSegment(code: string, name: string): ApprovalSegment {
  return new ApprovalSegment(code, name, 0, "", 0, "", "", 0, "requested");
}
