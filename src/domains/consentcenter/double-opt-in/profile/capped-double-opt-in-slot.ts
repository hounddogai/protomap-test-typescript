import * as text from "../../../../kit/text.js";

/** Where a capped double opt in slot is in its life cycle. */
export type CappedDoubleOptInSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** One capped double opt in slot, with what the planners need to act on it. */
export class CappedDoubleOptInSlot {
  code: string;
  name: string;
  audienceId: string;
  visible: boolean;
  title: string;
  phone: string;
  attempts: number;
  archived: boolean;
  variant: string;
  status: CappedDoubleOptInSlotStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    visible: boolean,
    title: string,
    phone: string,
    attempts: number,
    archived: boolean,
    variant: string,
    status: CappedDoubleOptInSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.visible = visible;
    this.title = title;
    this.phone = phone;
    this.attempts = attempts;
    this.archived = archived;
    this.variant = variant;
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

  canMoveTo(next: CappedDoubleOptInSlotStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedDoubleOptInSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped double opt in slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.attempts;
  }

  copy(): CappedDoubleOptInSlot {
    return new CappedDoubleOptInSlot(
      this.code,
      this.name,
      this.audienceId,
      this.visible,
      this.title,
      this.phone,
      this.attempts,
      this.archived,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped double opt in slot in status new. */
export function newCappedDoubleOptInSlot(code: string, name: string): CappedDoubleOptInSlot {
  return new CappedDoubleOptInSlot(code, name, "", false, "", "", 0, false, "", "new");
}
