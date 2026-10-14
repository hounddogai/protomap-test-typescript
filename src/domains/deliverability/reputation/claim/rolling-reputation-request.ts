import * as text from "../../../../kit/text.js";

/** Where a rolling reputation request is in its life cycle. */
export type RollingReputationRequestStatus = "created" | "validated" | "published" | "retired";

/** The record of a rolling reputation request and its current status. */
export class RollingReputationRequest {
  code: string;
  label: string;
  archived: boolean;
  discount: number;
  sequence: number;
  country: string;
  status: RollingReputationRequestStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    discount: number,
    sequence: number,
    country: string,
    status: RollingReputationRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.discount = discount;
    this.sequence = sequence;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingReputationRequestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingReputationRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling reputation request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveVolume(): number {
    return Math.round(this.sequence * this.discount * 100) / 100;
  }

  copy(): RollingReputationRequest {
    return new RollingReputationRequest(
      this.code,
      this.label,
      this.archived,
      this.discount,
      this.sequence,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a rolling reputation request in status created. */
export function newRollingReputationRequest(code: string, label: string): RollingReputationRequest {
  return new RollingReputationRequest(code, label, false, 0, 0, "", "created");
}
