import * as text from "../../../../kit/text.js";

/** Where a nudge slot is in its life cycle. */
export type NudgeSlotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One nudge slot, with what the planners need to act on it. */
export class NudgeSlot {
  code: string;
  name: string;
  locale: string;
  channel: string;
  approved: boolean;
  tags: string[];
  timezone: string;
  unit: string;
  amount: number;
  status: NudgeSlotStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    channel: string,
    approved: boolean,
    tags: string[],
    timezone: string,
    unit: string,
    amount: number,
    status: NudgeSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.channel = channel;
    this.approved = approved;
    this.tags = tags;
    this.timezone = timezone;
    this.unit = unit;
    this.amount = amount;
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

  canMoveTo(next: NudgeSlotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
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

  moveTo(next: NudgeSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): NudgeSlot {
    return new NudgeSlot(
      this.code,
      this.name,
      this.locale,
      this.channel,
      this.approved,
      this.tags,
      this.timezone,
      this.unit,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a nudge slot in status planned. */
export function newNudgeSlot(code: string, name: string): NudgeSlot {
  return new NudgeSlot(code, name, "", "", false, [], "", "", 0, "planned");
}
