import * as text from "../../../../kit/text.js";

/** Where a primary branch preference is in its life cycle. */
export type PrimaryBranchPreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A primary branch preference as the branch team keeps it. */
export class PrimaryBranchPreference {
  code: string;
  name: string;
  description: string;
  sendAt: number;
  threshold: number;
  retries: number;
  approved: boolean;
  externalRef: string;
  title: string;
  contactEmail: string;
  unit: string;
  status: PrimaryBranchPreferenceStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    sendAt: number,
    threshold: number,
    retries: number,
    approved: boolean,
    externalRef: string,
    title: string,
    contactEmail: string,
    unit: string,
    status: PrimaryBranchPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.sendAt = sendAt;
    this.threshold = threshold;
    this.retries = retries;
    this.approved = approved;
    this.externalRef = externalRef;
    this.title = title;
    this.contactEmail = contactEmail;
    this.unit = unit;
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

  canMoveTo(next: PrimaryBranchPreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryBranchPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary branch preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"primary branch preference"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.threshold - this.sendAt) * 100) / 100;
  }

  copy(): PrimaryBranchPreference {
    return new PrimaryBranchPreference(
      this.code,
      this.name,
      this.description,
      this.sendAt,
      this.threshold,
      this.retries,
      this.approved,
      this.externalRef,
      this.title,
      this.contactEmail,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a primary branch preference in status planned. */
export function newPrimaryBranchPreference(code: string, name: string): PrimaryBranchPreference {
  return new PrimaryBranchPreference(code, name, "", 0, 0, 0, false, "", "", "", "", "planned");
}
