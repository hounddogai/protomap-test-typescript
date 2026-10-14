import * as text from "../../../../kit/text.js";

/** Where a reputation draft is in its life cycle. */
export type ReputationDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A reputation draft. Its code is unique within a tenant. */
export class ReputationDraft {
  code: string;
  name: string;
  campaignRef: string;
  margin: number;
  windowDays: number;
  description: string;
  approved: boolean;
  durationMinutes: number;
  status: ReputationDraftStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    margin: number,
    windowDays: number,
    description: string,
    approved: boolean,
    durationMinutes: number,
    status: ReputationDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.margin = margin;
    this.windowDays = windowDays;
    this.description = description;
    this.approved = approved;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: ReputationDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
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

  moveTo(next: ReputationDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round((this.durationMinutes + this.windowDays) * 100) / 100;
  }

  copy(): ReputationDraft {
    return new ReputationDraft(
      this.code,
      this.name,
      this.campaignRef,
      this.margin,
      this.windowDays,
      this.description,
      this.approved,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reputation draft in status proposed. */
export function newReputationDraft(code: string, name: string): ReputationDraft {
  return new ReputationDraft(code, name, "", 0, 0, "", false, 0, "proposed");
}
