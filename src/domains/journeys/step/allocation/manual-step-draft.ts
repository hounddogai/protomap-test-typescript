import * as text from "../../../../kit/text.js";

/** Where a manual step draft is in its life cycle. */
export type ManualStepDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a manual step draft and its current status. */
export class ManualStepDraft {
  code: string;
  label: string;
  cost: number;
  version: number;
  checksum: string;
  rate: number;
  name: string;
  locale: string;
  visible: boolean;
  status: ManualStepDraftStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    version: number,
    checksum: string,
    rate: number,
    name: string,
    locale: string,
    visible: boolean,
    status: ManualStepDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.version = version;
    this.checksum = checksum;
    this.rate = rate;
    this.name = name;
    this.locale = locale;
    this.visible = visible;
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

  canMoveTo(next: ManualStepDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ManualStepDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual step draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netTotal(): number {
    return Math.round(this.cost * this.version * 100) / 100;
  }

  copy(): ManualStepDraft {
    return new ManualStepDraft(
      this.code,
      this.label,
      this.cost,
      this.version,
      this.checksum,
      this.rate,
      this.name,
      this.locale,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual step draft in status proposed. */
export function newManualStepDraft(code: string, label: string): ManualStepDraft {
  return new ManualStepDraft(code, label, 0, 0, "", 0, "", "", false, "proposed");
}
