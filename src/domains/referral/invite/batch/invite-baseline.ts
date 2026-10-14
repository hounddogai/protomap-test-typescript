import * as text from "../../../../kit/text.js";

/** Where a invite baseline is in its life cycle. */
export type InviteBaselineStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A invite baseline. Its code is unique within a tenant. */
export class InviteBaseline {
  code: string;
  label: string;
  channel: string;
  cohort: string;
  discount: number;
  version: number;
  status: InviteBaselineStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    cohort: string,
    discount: number,
    version: number,
    status: InviteBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.cohort = cohort;
    this.discount = discount;
    this.version = version;
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

  canMoveTo(next: InviteBaselineStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedVolume(): number {
    return Math.round((this.version - this.discount) * 100) / 100;
  }

  copy(): InviteBaseline {
    return new InviteBaseline(
      this.code,
      this.label,
      this.channel,
      this.cohort,
      this.discount,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a invite baseline in status planned. */
export function newInviteBaseline(code: string, label: string): InviteBaseline {
  return new InviteBaseline(code, label, "", "", 0, 0, "planned");
}
