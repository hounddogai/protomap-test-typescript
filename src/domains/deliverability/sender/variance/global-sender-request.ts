import * as text from "../../../../kit/text.js";

/** Where a global sender request is in its life cycle. */
export type GlobalSenderRequestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global sender request as the sender team keeps it. */
export class GlobalSenderRequest {
  code: string;
  name: string;
  label: string;
  openRate: number;
  title: string;
  version: number;
  phone: string;
  cohort: string;
  summary: string;
  status: GlobalSenderRequestStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    openRate: number,
    title: string,
    version: number,
    phone: string,
    cohort: string,
    summary: string,
    status: GlobalSenderRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.openRate = openRate;
    this.title = title;
    this.version = version;
    this.phone = phone;
    this.cohort = cohort;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalSenderRequestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalSenderRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global sender request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"global sender request"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.version + this.openRate) * 100) / 100;
  }

  copy(): GlobalSenderRequest {
    return new GlobalSenderRequest(
      this.code,
      this.name,
      this.label,
      this.openRate,
      this.title,
      this.version,
      this.phone,
      this.cohort,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global sender request in status planned. */
export function newGlobalSenderRequest(code: string, name: string): GlobalSenderRequest {
  return new GlobalSenderRequest(code, name, "", 0, "", 0, "", "", "", "planned");
}
