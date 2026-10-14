import * as text from "../../../../kit/text.js";

/** Where a global pacing request is in its life cycle. */
export type GlobalPacingRequestStatus = "requested" | "granted" | "revoked" | "expired";

/** A global pacing request as the pacing team keeps it. */
export class GlobalPacingRequest {
  code: string;
  label: string;
  priority: number;
  batchSize: number;
  cost: number;
  rate: number;
  status: GlobalPacingRequestStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    batchSize: number,
    cost: number,
    rate: number,
    status: GlobalPacingRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.batchSize = batchSize;
    this.cost = cost;
    this.rate = rate;
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

  canMoveTo(next: GlobalPacingRequestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalPacingRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global pacing request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedVolume(): number {
    return Math.round((this.priority - this.cost) * 100) / 100;
  }

  copy(): GlobalPacingRequest {
    return new GlobalPacingRequest(
      this.code,
      this.label,
      this.priority,
      this.batchSize,
      this.cost,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global pacing request in status requested. */
export function newGlobalPacingRequest(code: string, label: string): GlobalPacingRequest {
  return new GlobalPacingRequest(code, label, 0, 0, 0, 0, "requested");
}
