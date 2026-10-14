import * as text from "../../../../kit/text.js";

/** Where a redemption request is in its life cycle. */
export type RedemptionRequestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A redemption request. Its code is unique within a tenant. */
export class RedemptionRequest {
  code: string;
  name: string;
  retries: number;
  endsAt: number;
  margin: number;
  status: RedemptionRequestStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    endsAt: number,
    margin: number,
    status: RedemptionRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.endsAt = endsAt;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RedemptionRequestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedVolume(): number {
    return Math.round((this.margin + this.endsAt) * 100) / 100;
  }

  copy(): RedemptionRequest {
    return new RedemptionRequest(this.code, this.name, this.retries, this.endsAt, this.margin, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a redemption request in status open. */
export function newRedemptionRequest(code: string, name: string): RedemptionRequest {
  return new RedemptionRequest(code, name, 0, 0, 0, "open");
}
