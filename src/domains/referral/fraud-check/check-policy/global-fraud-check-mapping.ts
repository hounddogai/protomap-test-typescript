import * as text from "../../../../kit/text.js";

/** Where a global fraud check mapping is in its life cycle. */
export type GlobalFraudCheckMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One global fraud check mapping, with what the planners need to act on it. */
export class GlobalFraudCheckMapping {
  code: string;
  label: string;
  contactEmail: string;
  revision: number;
  conversionRate: number;
  checksum: string;
  notes: string;
  limit: number;
  retries: number;
  minimum: number;
  attempts: number;
  status: GlobalFraudCheckMappingStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    revision: number,
    conversionRate: number,
    checksum: string,
    notes: string,
    limit: number,
    retries: number,
    minimum: number,
    attempts: number,
    status: GlobalFraudCheckMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.revision = revision;
    this.conversionRate = conversionRate;
    this.checksum = checksum;
    this.notes = notes;
    this.limit = limit;
    this.retries = retries;
    this.minimum = minimum;
    this.attempts = attempts;
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

  canMoveTo(next: GlobalFraudCheckMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
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

  moveTo(next: GlobalFraudCheckMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global fraud check mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.limit - this.attempts) * 100) / 100;
  }

  copy(): GlobalFraudCheckMapping {
    return new GlobalFraudCheckMapping(
      this.code,
      this.label,
      this.contactEmail,
      this.revision,
      this.conversionRate,
      this.checksum,
      this.notes,
      this.limit,
      this.retries,
      this.minimum,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global fraud check mapping in status proposed. */
export function newGlobalFraudCheckMapping(code: string, label: string): GlobalFraudCheckMapping {
  return new GlobalFraudCheckMapping(code, label, "", 0, 0, "", "", 0, 0, 0, 0, "proposed");
}
