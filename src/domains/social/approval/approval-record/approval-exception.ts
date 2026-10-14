import * as text from "../../../../kit/text.js";

/** Where a approval exception is in its life cycle. */
export type ApprovalExceptionStatus = "new" | "queued" | "running" | "done" | "failed";

/** A approval exception. Its code is unique within a tenant. */
export class ApprovalException {
  code: string;
  label: string;
  cohort: string;
  threshold: number;
  notes: string;
  locale: string;
  phone: string;
  name: string;
  description: string;
  externalRef: string;
  status: ApprovalExceptionStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    threshold: number,
    notes: string,
    locale: string,
    phone: string,
    name: string,
    description: string,
    externalRef: string,
    status: ApprovalExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.threshold = threshold;
    this.notes = notes;
    this.locale = locale;
    this.phone = phone;
    this.name = name;
    this.description = description;
    this.externalRef = externalRef;
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

  canMoveTo(next: ApprovalExceptionStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
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

  moveTo(next: ApprovalExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"approval exception"} ${this.code}`;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): ApprovalException {
    return new ApprovalException(
      this.code,
      this.label,
      this.cohort,
      this.threshold,
      this.notes,
      this.locale,
      this.phone,
      this.name,
      this.description,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a approval exception in status new. */
export function newApprovalException(code: string, label: string): ApprovalException {
  return new ApprovalException(code, label, "", 0, "", "", "", "", "", "", "new");
}
