import * as text from "../../../../kit/text.js";

/** Where a rolling touchpoint request is in its life cycle. */
export type RollingTouchpointRequestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A rolling touchpoint request as the touchpoint team keeps it. */
export class RollingTouchpointRequest {
  code: string;
  title: string;
  conversionRate: number;
  country: string;
  sequence: number;
  revision: number;
  ownerId: string;
  externalRef: string;
  budget: number;
  summary: string;
  description: string;
  status: RollingTouchpointRequestStatus;

  constructor(
    code: string,
    title: string,
    conversionRate: number,
    country: string,
    sequence: number,
    revision: number,
    ownerId: string,
    externalRef: string,
    budget: number,
    summary: string,
    description: string,
    status: RollingTouchpointRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRate = conversionRate;
    this.country = country;
    this.sequence = sequence;
    this.revision = revision;
    this.ownerId = ownerId;
    this.externalRef = externalRef;
    this.budget = budget;
    this.summary = summary;
    this.description = description;
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

  canMoveTo(next: RollingTouchpointRequestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingTouchpointRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling touchpoint request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"rolling touchpoint request"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.revision - this.sequence) * 100) / 100;
  }

  copy(): RollingTouchpointRequest {
    return new RollingTouchpointRequest(
      this.code,
      this.title,
      this.conversionRate,
      this.country,
      this.sequence,
      this.revision,
      this.ownerId,
      this.externalRef,
      this.budget,
      this.summary,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a rolling touchpoint request in status new. */
export function newRollingTouchpointRequest(code: string, title: string): RollingTouchpointRequest {
  return new RollingTouchpointRequest(code, title, 0, "", 0, 0, "", "", 0, "", "", "new");
}
