import * as text from "../../../../kit/text.js";

/** Where a fallback complaint exception is in its life cycle. */
export type FallbackComplaintExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A fallback complaint exception as the complaint team keeps it. */
export class FallbackComplaintException {
  code: string;
  title: string;
  externalRef: string;
  timezone: string;
  maximum: number;
  floorValue: number;
  contactEmail: string;
  name: string;
  source: string;
  frequencyCap: number;
  checksum: string;
  status: FallbackComplaintExceptionStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    timezone: string,
    maximum: number,
    floorValue: number,
    contactEmail: string,
    name: string,
    source: string,
    frequencyCap: number,
    checksum: string,
    status: FallbackComplaintExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.timezone = timezone;
    this.maximum = maximum;
    this.floorValue = floorValue;
    this.contactEmail = contactEmail;
    this.name = name;
    this.source = source;
    this.frequencyCap = frequencyCap;
    this.checksum = checksum;
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

  canMoveTo(next: FallbackComplaintExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackComplaintExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback complaint exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback complaint exception"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.maximum - this.floorValue) * 100) / 100;
  }

  copy(): FallbackComplaintException {
    return new FallbackComplaintException(
      this.code,
      this.title,
      this.externalRef,
      this.timezone,
      this.maximum,
      this.floorValue,
      this.contactEmail,
      this.name,
      this.source,
      this.frequencyCap,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a fallback complaint exception in status proposed. */
export function newFallbackComplaintException(code: string, title: string): FallbackComplaintException {
  return new FallbackComplaintException(code, title, "", "", 0, 0, "", "", "", 0, "", "proposed");
}
