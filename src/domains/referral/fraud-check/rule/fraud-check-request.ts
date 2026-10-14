import * as text from "../../../../kit/text.js";

/** Where a fraud check request is in its life cycle. */
export type FraudCheckRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A fraud check request as the fraud check team keeps it. */
export class FraudCheckRequest {
  code: string;
  label: string;
  ceiling: number;
  sequence: number;
  endsAt: number;
  timezone: string;
  active: boolean;
  tags: string[];
  country: string;
  pinned: boolean;
  createdAt: number;
  status: FraudCheckRequestStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    sequence: number,
    endsAt: number,
    timezone: string,
    active: boolean,
    tags: string[],
    country: string,
    pinned: boolean,
    createdAt: number,
    status: FraudCheckRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.sequence = sequence;
    this.endsAt = endsAt;
    this.timezone = timezone;
    this.active = active;
    this.tags = tags;
    this.country = country;
    this.pinned = pinned;
    this.createdAt = createdAt;
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

  canMoveTo(next: FraudCheckRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: FraudCheckRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round((this.createdAt - this.ceiling) * 100) / 100;
  }

  copy(): FraudCheckRequest {
    return new FraudCheckRequest(
      this.code,
      this.label,
      this.ceiling,
      this.sequence,
      this.endsAt,
      this.timezone,
      this.active,
      this.tags,
      this.country,
      this.pinned,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fraud check request in status draft. */
export function newFraudCheckRequest(code: string, label: string): FraudCheckRequest {
  return new FraudCheckRequest(code, label, 0, 0, 0, "", false, [], "", false, 0, "draft");
}
