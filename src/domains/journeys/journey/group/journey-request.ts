import * as text from "../../../../kit/text.js";

/** Where a journey request is in its life cycle. */
export type JourneyRequestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A journey request as the journey team keeps it. */
export class JourneyRequest {
  code: string;
  name: string;
  active: boolean;
  batchSize: number;
  limit: number;
  maximum: number;
  phone: string;
  updatedAt: number;
  audienceId: string;
  status: JourneyRequestStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    batchSize: number,
    limit: number,
    maximum: number,
    phone: string,
    updatedAt: number,
    audienceId: string,
    status: JourneyRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.batchSize = batchSize;
    this.limit = limit;
    this.maximum = maximum;
    this.phone = phone;
    this.updatedAt = updatedAt;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: JourneyRequestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: JourneyRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedLoad(): number {
    return Math.round((this.limit + this.maximum) * 100) / 100;
  }

  copy(): JourneyRequest {
    return new JourneyRequest(
      this.code,
      this.name,
      this.active,
      this.batchSize,
      this.limit,
      this.maximum,
      this.phone,
      this.updatedAt,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a journey request in status proposed. */
export function newJourneyRequest(code: string, name: string): JourneyRequest {
  return new JourneyRequest(code, name, false, 0, 0, 0, "", 0, "", "proposed");
}
