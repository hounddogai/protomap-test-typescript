import * as text from "../../../../kit/text.js";

/** Where a global complaint draft is in its life cycle. */
export type GlobalComplaintDraftStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A global complaint draft as the complaint team keeps it. */
export class GlobalComplaintDraft {
  code: string;
  name: string;
  frequencyCap: number;
  externalRef: string;
  amount: number;
  expiresAt: number;
  conversionRate: number;
  revision: number;
  durationMinutes: number;
  weight: number;
  status: GlobalComplaintDraftStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    externalRef: string,
    amount: number,
    expiresAt: number,
    conversionRate: number,
    revision: number,
    durationMinutes: number,
    weight: number,
    status: GlobalComplaintDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.externalRef = externalRef;
    this.amount = amount;
    this.expiresAt = expiresAt;
    this.conversionRate = conversionRate;
    this.revision = revision;
    this.durationMinutes = durationMinutes;
    this.weight = weight;
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

  canMoveTo(next: GlobalComplaintDraftStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalComplaintDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global complaint draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"global complaint draft"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.expiresAt - this.frequencyCap) * 100) / 100;
  }

  copy(): GlobalComplaintDraft {
    return new GlobalComplaintDraft(
      this.code,
      this.name,
      this.frequencyCap,
      this.externalRef,
      this.amount,
      this.expiresAt,
      this.conversionRate,
      this.revision,
      this.durationMinutes,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global complaint draft in status draft. */
export function newGlobalComplaintDraft(code: string, name: string): GlobalComplaintDraft {
  return new GlobalComplaintDraft(code, name, 0, "", 0, 0, 0, 0, 0, 0, "draft");
}
