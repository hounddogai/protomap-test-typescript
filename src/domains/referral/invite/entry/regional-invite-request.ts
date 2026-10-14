import * as text from "../../../../kit/text.js";

/** Where a regional invite request is in its life cycle. */
export type RegionalInviteRequestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a regional invite request and its current status. */
export class RegionalInviteRequest {
  code: string;
  label: string;
  externalRef: string;
  updatedAt: number;
  floorValue: number;
  status: RegionalInviteRequestStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    updatedAt: number,
    floorValue: number,
    status: RegionalInviteRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.updatedAt = updatedAt;
    this.floorValue = floorValue;
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

  canMoveTo(next: RegionalInviteRequestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
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

  moveTo(next: RegionalInviteRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional invite request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"regional invite request"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.updatedAt * this.floorValue * 100) / 100;
  }

  copy(): RegionalInviteRequest {
    return new RegionalInviteRequest(
      this.code,
      this.label,
      this.externalRef,
      this.updatedAt,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional invite request in status open. */
export function newRegionalInviteRequest(code: string, label: string): RegionalInviteRequest {
  return new RegionalInviteRequest(code, label, "", 0, 0, "open");
}
