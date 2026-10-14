import * as text from "../../../../kit/text.js";

/** Where a pending sender agreement is in its life cycle. */
export type PendingSenderAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** A pending sender agreement as the sender team keeps it. */
export class PendingSenderAgreement {
  code: string;
  label: string;
  budget: number;
  journeyId: string;
  category: string;
  active: boolean;
  status: PendingSenderAgreementStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    journeyId: string,
    category: string,
    active: boolean,
    status: PendingSenderAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.journeyId = journeyId;
    this.category = category;
    this.active = active;
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

  canMoveTo(next: PendingSenderAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PendingSenderAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending sender agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): PendingSenderAgreement {
    return new PendingSenderAgreement(
      this.code,
      this.label,
      this.budget,
      this.journeyId,
      this.category,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pending sender agreement in status new. */
export function newPendingSenderAgreement(code: string, label: string): PendingSenderAgreement {
  return new PendingSenderAgreement(code, label, 0, "", "", false, "new");
}
