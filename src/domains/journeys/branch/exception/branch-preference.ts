import * as text from "../../../../kit/text.js";

/** Where a branch preference is in its life cycle. */
export type BranchPreferenceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A branch preference. Its code is unique within a tenant. */
export class BranchPreference {
  code: string;
  name: string;
  rate: number;
  contactEmail: string;
  notes: string;
  archived: boolean;
  graceDays: number;
  budget: number;
  floorValue: number;
  audienceId: string;
  status: BranchPreferenceStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    contactEmail: string,
    notes: string,
    archived: boolean,
    graceDays: number,
    budget: number,
    floorValue: number,
    audienceId: string,
    status: BranchPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.contactEmail = contactEmail;
    this.notes = notes;
    this.archived = archived;
    this.graceDays = graceDays;
    this.budget = budget;
    this.floorValue = floorValue;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BranchPreferenceStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BranchPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round((this.rate - this.graceDays) * 100) / 100;
  }

  copy(): BranchPreference {
    return new BranchPreference(
      this.code,
      this.name,
      this.rate,
      this.contactEmail,
      this.notes,
      this.archived,
      this.graceDays,
      this.budget,
      this.floorValue,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a branch preference in status draft. */
export function newBranchPreference(code: string, name: string): BranchPreference {
  return new BranchPreference(code, name, 0, "", "", false, 0, 0, 0, "", "draft");
}
