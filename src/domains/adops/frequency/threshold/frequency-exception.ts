import * as text from "../../../../kit/text.js";

/** Where a frequency exception is in its life cycle. */
export type FrequencyExceptionStatus = "requested" | "granted" | "revoked" | "expired";

/** One frequency exception, with what the planners need to act on it. */
export class FrequencyException {
  code: string;
  title: string;
  graceDays: number;
  floorValue: number;
  margin: number;
  ceiling: number;
  summary: string;
  country: string;
  durationMinutes: number;
  contactEmail: string;
  status: FrequencyExceptionStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    floorValue: number,
    margin: number,
    ceiling: number,
    summary: string,
    country: string,
    durationMinutes: number,
    contactEmail: string,
    status: FrequencyExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.floorValue = floorValue;
    this.margin = margin;
    this.ceiling = ceiling;
    this.summary = summary;
    this.country = country;
    this.durationMinutes = durationMinutes;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: FrequencyExceptionStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FrequencyExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.ceiling - this.graceDays) * 100) / 100;
  }

  copy(): FrequencyException {
    return new FrequencyException(
      this.code,
      this.title,
      this.graceDays,
      this.floorValue,
      this.margin,
      this.ceiling,
      this.summary,
      this.country,
      this.durationMinutes,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a frequency exception in status requested. */
export function newFrequencyException(code: string, title: string): FrequencyException {
  return new FrequencyException(code, title, 0, 0, 0, 0, "", "", 0, "", "requested");
}
