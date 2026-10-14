import * as text from "../../../../kit/text.js";

/** Where a reputation request is in its life cycle. */
export type ReputationRequestStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a reputation request and its current status. */
export class ReputationRequest {
  code: string;
  title: string;
  country: string;
  batchSize: number;
  expiresAt: number;
  currency: string;
  maximum: number;
  approved: boolean;
  limit: number;
  rate: number;
  revision: number;
  status: ReputationRequestStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    batchSize: number,
    expiresAt: number,
    currency: string,
    maximum: number,
    approved: boolean,
    limit: number,
    rate: number,
    revision: number,
    status: ReputationRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.batchSize = batchSize;
    this.expiresAt = expiresAt;
    this.currency = currency;
    this.maximum = maximum;
    this.approved = approved;
    this.limit = limit;
    this.rate = rate;
    this.revision = revision;
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

  canMoveTo(next: ReputationRequestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
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

  moveTo(next: ReputationRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"reputation request"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.expiresAt * this.limit * 100) / 100;
  }

  copy(): ReputationRequest {
    return new ReputationRequest(
      this.code,
      this.title,
      this.country,
      this.batchSize,
      this.expiresAt,
      this.currency,
      this.maximum,
      this.approved,
      this.limit,
      this.rate,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a reputation request in status requested. */
export function newReputationRequest(code: string, title: string): ReputationRequest {
  return new ReputationRequest(code, title, "", 0, 0, "", 0, false, 0, 0, 0, "requested");
}
