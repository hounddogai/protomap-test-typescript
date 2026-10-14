import * as text from "../../../../kit/text.js";

/** Where a regional queue request is in its life cycle. */
export type RegionalQueueRequestStatus = "requested" | "granted" | "revoked" | "expired";

/** One regional queue request, with what the planners need to act on it. */
export class RegionalQueueRequest {
  code: string;
  label: string;
  attempts: number;
  score: number;
  sendAt: number;
  sequence: number;
  floorValue: number;
  expiresAt: number;
  retries: number;
  conversionRate: number;
  status: RegionalQueueRequestStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    score: number,
    sendAt: number,
    sequence: number,
    floorValue: number,
    expiresAt: number,
    retries: number,
    conversionRate: number,
    status: RegionalQueueRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.score = score;
    this.sendAt = sendAt;
    this.sequence = sequence;
    this.floorValue = floorValue;
    this.expiresAt = expiresAt;
    this.retries = retries;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: RegionalQueueRequestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RegionalQueueRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional queue request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"regional queue request"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.floorValue * this.sequence * 100) / 100;
  }

  copy(): RegionalQueueRequest {
    return new RegionalQueueRequest(
      this.code,
      this.label,
      this.attempts,
      this.score,
      this.sendAt,
      this.sequence,
      this.floorValue,
      this.expiresAt,
      this.retries,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional queue request in status requested. */
export function newRegionalQueueRequest(code: string, label: string): RegionalQueueRequest {
  return new RegionalQueueRequest(code, label, 0, 0, 0, 0, 0, 0, 0, 0, "requested");
}
