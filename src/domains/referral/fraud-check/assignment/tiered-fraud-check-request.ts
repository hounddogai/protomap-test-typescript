import * as text from "../../../../kit/text.js";

/** Where a tiered fraud check request is in its life cycle. */
export type TieredFraudCheckRequestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered fraud check request as the fraud check team keeps it. */
export class TieredFraudCheckRequest {
  code: string;
  label: string;
  contactEmail: string;
  ownerId: string;
  journeyId: string;
  score: number;
  status: TieredFraudCheckRequestStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    ownerId: string,
    journeyId: string,
    score: number,
    status: TieredFraudCheckRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.ownerId = ownerId;
    this.journeyId = journeyId;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredFraudCheckRequestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TieredFraudCheckRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered fraud check request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): TieredFraudCheckRequest {
    return new TieredFraudCheckRequest(
      this.code,
      this.label,
      this.contactEmail,
      this.ownerId,
      this.journeyId,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered fraud check request in status new. */
export function newTieredFraudCheckRequest(code: string, label: string): TieredFraudCheckRequest {
  return new TieredFraudCheckRequest(code, label, "", "", "", 0, "new");
}
