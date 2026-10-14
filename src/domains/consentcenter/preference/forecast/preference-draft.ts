import * as text from "../../../../kit/text.js";

/** Where a preference draft is in its life cycle. */
export type PreferenceDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A preference draft. Its code is unique within a tenant. */
export class PreferenceDraft {
  code: string;
  label: string;
  notes: string;
  visible: boolean;
  journeyId: string;
  cost: number;
  checksum: string;
  status: PreferenceDraftStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    visible: boolean,
    journeyId: string,
    cost: number,
    checksum: string,
    status: PreferenceDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.visible = visible;
    this.journeyId = journeyId;
    this.cost = cost;
    this.checksum = checksum;
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

  canMoveTo(next: PreferenceDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
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

  moveTo(next: PreferenceDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): PreferenceDraft {
    return new PreferenceDraft(
      this.code,
      this.label,
      this.notes,
      this.visible,
      this.journeyId,
      this.cost,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a preference draft in status proposed. */
export function newPreferenceDraft(code: string, label: string): PreferenceDraft {
  return new PreferenceDraft(code, label, "", false, "", 0, "", "proposed");
}
