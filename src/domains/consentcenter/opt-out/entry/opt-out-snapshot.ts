import * as text from "../../../../kit/text.js";

/** Where a opt out snapshot is in its life cycle. */
export type OptOutSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A opt out snapshot. Its code is unique within a tenant. */
export class OptOutSnapshot {
  code: string;
  label: string;
  contactEmail: string;
  region: string;
  segment: string;
  country: string;
  quantity: number;
  status: OptOutSnapshotStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    region: string,
    segment: string,
    country: string,
    quantity: number,
    status: OptOutSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.region = region;
    this.segment = segment;
    this.country = country;
    this.quantity = quantity;
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

  canMoveTo(next: OptOutSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: OptOutSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): OptOutSnapshot {
    return new OptOutSnapshot(
      this.code,
      this.label,
      this.contactEmail,
      this.region,
      this.segment,
      this.country,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a opt out snapshot in status draft. */
export function newOptOutSnapshot(code: string, label: string): OptOutSnapshot {
  return new OptOutSnapshot(code, label, "", "", "", "", 0, "draft");
}
