import * as text from "../../../../kit/text.js";

/** Where a badge preference is in its life cycle. */
export type BadgePreferenceStatus = "created" | "validated" | "published" | "retired";

/** The record of a badge preference and its current status. */
export class BadgePreference {
  code: string;
  label: string;
  approved: boolean;
  priority: number;
  sendAt: number;
  amount: number;
  channel: string;
  status: BadgePreferenceStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    priority: number,
    sendAt: number,
    amount: number,
    channel: string,
    status: BadgePreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.priority = priority;
    this.sendAt = sendAt;
    this.amount = amount;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BadgePreferenceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round(this.priority * this.sendAt * 100) / 100;
  }

  copy(): BadgePreference {
    return new BadgePreference(
      this.code,
      this.label,
      this.approved,
      this.priority,
      this.sendAt,
      this.amount,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a badge preference in status created. */
export function newBadgePreference(code: string, label: string): BadgePreference {
  return new BadgePreference(code, label, false, 0, 0, 0, "", "created");
}
