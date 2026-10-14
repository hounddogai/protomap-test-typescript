import * as text from "../../../../kit/text.js";

/** Where a retention request is in its life cycle. */
export type RetentionRequestStatus = "created" | "validated" | "published" | "retired";

/** A retention request. Its code is unique within a tenant. */
export class RetentionRequest {
  code: string;
  name: string;
  quantity: number;
  audienceId: string;
  unit: string;
  category: string;
  journeyId: string;
  variant: string;
  windowDays: number;
  status: RetentionRequestStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    audienceId: string,
    unit: string,
    category: string,
    journeyId: string,
    variant: string,
    windowDays: number,
    status: RetentionRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.audienceId = audienceId;
    this.unit = unit;
    this.category = category;
    this.journeyId = journeyId;
    this.variant = variant;
    this.windowDays = windowDays;
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

  canMoveTo(next: RetentionRequestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RetentionRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round(this.windowDays * this.quantity * 100) / 100;
  }

  copy(): RetentionRequest {
    return new RetentionRequest(
      this.code,
      this.name,
      this.quantity,
      this.audienceId,
      this.unit,
      this.category,
      this.journeyId,
      this.variant,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a retention request in status created. */
export function newRetentionRequest(code: string, name: string): RetentionRequest {
  return new RetentionRequest(code, name, 0, "", "", "", "", "", 0, "created");
}
