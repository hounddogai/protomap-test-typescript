import * as text from "../../../../kit/text.js";

/** Where a mention window is in its life cycle. */
export type MentionWindowStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A mention window. Its code is unique within a tenant. */
export class MentionWindow {
  code: string;
  name: string;
  label: string;
  contactEmail: string;
  capacity: number;
  graceDays: number;
  variant: string;
  unit: string;
  title: string;
  weight: number;
  status: MentionWindowStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    contactEmail: string,
    capacity: number,
    graceDays: number,
    variant: string,
    unit: string,
    title: string,
    weight: number,
    status: MentionWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.contactEmail = contactEmail;
    this.capacity = capacity;
    this.graceDays = graceDays;
    this.variant = variant;
    this.unit = unit;
    this.title = title;
    this.weight = weight;
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

  canMoveTo(next: MentionWindowStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
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

  moveTo(next: MentionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"mention window"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.capacity * this.weight * 100) / 100;
  }

  copy(): MentionWindow {
    return new MentionWindow(
      this.code,
      this.name,
      this.label,
      this.contactEmail,
      this.capacity,
      this.graceDays,
      this.variant,
      this.unit,
      this.title,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a mention window in status proposed. */
export function newMentionWindow(code: string, name: string): MentionWindow {
  return new MentionWindow(code, name, "", "", 0, 0, "", "", "", 0, "proposed");
}
