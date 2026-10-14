import * as text from "../../../../kit/text.js";

/** Where a global suppression allocation is in its life cycle. */
export type GlobalSuppressionAllocationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a global suppression allocation and its current status. */
export class GlobalSuppressionAllocation {
  code: string;
  title: string;
  campaignRef: string;
  category: string;
  pinned: boolean;
  phone: string;
  summary: string;
  country: string;
  windowDays: number;
  status: GlobalSuppressionAllocationStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    category: string,
    pinned: boolean,
    phone: string,
    summary: string,
    country: string,
    windowDays: number,
    status: GlobalSuppressionAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.category = category;
    this.pinned = pinned;
    this.phone = phone;
    this.summary = summary;
    this.country = country;
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

  canMoveTo(next: GlobalSuppressionAllocationStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: GlobalSuppressionAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global suppression allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.windowDays;
  }

  copy(): GlobalSuppressionAllocation {
    return new GlobalSuppressionAllocation(
      this.code,
      this.title,
      this.campaignRef,
      this.category,
      this.pinned,
      this.phone,
      this.summary,
      this.country,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a global suppression allocation in status draft. */
export function newGlobalSuppressionAllocation(code: string, title: string): GlobalSuppressionAllocation {
  return new GlobalSuppressionAllocation(code, title, "", "", false, "", "", "", 0, "draft");
}
