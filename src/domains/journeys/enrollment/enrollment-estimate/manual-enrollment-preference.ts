import * as text from "../../../../kit/text.js";

/** Where a manual enrollment preference is in its life cycle. */
export type ManualEnrollmentPreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** A manual enrollment preference as the enrollment team keeps it. */
export class ManualEnrollmentPreference {
  code: string;
  title: string;
  locale: string;
  cohort: string;
  quantity: number;
  sendAt: number;
  windowDays: number;
  frequencyCap: number;
  status: ManualEnrollmentPreferenceStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    cohort: string,
    quantity: number,
    sendAt: number,
    windowDays: number,
    frequencyCap: number,
    status: ManualEnrollmentPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.cohort = cohort;
    this.quantity = quantity;
    this.sendAt = sendAt;
    this.windowDays = windowDays;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: ManualEnrollmentPreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
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

  moveTo(next: ManualEnrollmentPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual enrollment preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedLoad(): number {
    return Math.round((this.frequencyCap + this.sendAt) * 100) / 100;
  }

  copy(): ManualEnrollmentPreference {
    return new ManualEnrollmentPreference(
      this.code,
      this.title,
      this.locale,
      this.cohort,
      this.quantity,
      this.sendAt,
      this.windowDays,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual enrollment preference in status requested. */
export function newManualEnrollmentPreference(code: string, title: string): ManualEnrollmentPreference {
  return new ManualEnrollmentPreference(code, title, "", "", 0, 0, 0, 0, "requested");
}
