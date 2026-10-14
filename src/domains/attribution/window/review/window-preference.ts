import * as text from "../../../../kit/text.js";

/** Where a window preference is in its life cycle. */
export type WindowPreferenceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A window preference. Its code is unique within a tenant. */
export class WindowPreference {
  code: string;
  label: string;
  source: string;
  reviewer: string;
  ownerId: string;
  quantity: number;
  status: WindowPreferenceStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    reviewer: string,
    ownerId: string,
    quantity: number,
    status: WindowPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.reviewer = reviewer;
    this.ownerId = ownerId;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: WindowPreferenceStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"window preference"} ${this.code}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): WindowPreference {
    return new WindowPreference(
      this.code,
      this.label,
      this.source,
      this.reviewer,
      this.ownerId,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a window preference in status open. */
export function newWindowPreference(code: string, label: string): WindowPreference {
  return new WindowPreference(code, label, "", "", "", 0, "open");
}
