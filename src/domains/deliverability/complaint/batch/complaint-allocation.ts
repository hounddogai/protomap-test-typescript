import * as text from "../../../../kit/text.js";

/** Where a complaint allocation is in its life cycle. */
export type ComplaintAllocationStatus = "requested" | "granted" | "revoked" | "expired";

/** One complaint allocation, with what the planners need to act on it. */
export class ComplaintAllocation {
  code: string;
  name: string;
  frequencyCap: number;
  externalRef: string;
  segment: string;
  pinned: boolean;
  status: ComplaintAllocationStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    externalRef: string,
    segment: string,
    pinned: boolean,
    status: ComplaintAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.externalRef = externalRef;
    this.segment = segment;
    this.pinned = pinned;
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

  canMoveTo(next: ComplaintAllocationStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ComplaintAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): ComplaintAllocation {
    return new ComplaintAllocation(
      this.code,
      this.name,
      this.frequencyCap,
      this.externalRef,
      this.segment,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a complaint allocation in status requested. */
export function newComplaintAllocation(code: string, name: string): ComplaintAllocation {
  return new ComplaintAllocation(code, name, 0, "", "", false, "requested");
}
