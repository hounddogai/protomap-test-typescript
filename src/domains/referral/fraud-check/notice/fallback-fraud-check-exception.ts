import * as text from "../../../../kit/text.js";

/** Where a fallback fraud check exception is in its life cycle. */
export type FallbackFraudCheckExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A fallback fraud check exception. Its code is unique within a tenant. */
export class FallbackFraudCheckException {
  code: string;
  label: string;
  cohort: string;
  utmSource: string;
  country: string;
  createdAt: number;
  description: string;
  audienceId: string;
  notes: string;
  source: string;
  status: FallbackFraudCheckExceptionStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    utmSource: string,
    country: string,
    createdAt: number,
    description: string,
    audienceId: string,
    notes: string,
    source: string,
    status: FallbackFraudCheckExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.utmSource = utmSource;
    this.country = country;
    this.createdAt = createdAt;
    this.description = description;
    this.audienceId = audienceId;
    this.notes = notes;
    this.source = source;
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

  canMoveTo(next: FallbackFraudCheckExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FallbackFraudCheckExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback fraud check exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"fallback fraud check exception"} ${this.code}`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): FallbackFraudCheckException {
    return new FallbackFraudCheckException(
      this.code,
      this.label,
      this.cohort,
      this.utmSource,
      this.country,
      this.createdAt,
      this.description,
      this.audienceId,
      this.notes,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a fallback fraud check exception in status proposed. */
export function newFallbackFraudCheckException(code: string, label: string): FallbackFraudCheckException {
  return new FallbackFraudCheckException(code, label, "", "", "", 0, "", "", "", "", "proposed");
}
