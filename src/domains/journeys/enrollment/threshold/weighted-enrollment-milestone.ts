import * as text from "../../../../kit/text.js";

/** Where a weighted enrollment milestone is in its life cycle. */
export type WeightedEnrollmentMilestoneStatus = "new" | "queued" | "running" | "done" | "failed";

/** A weighted enrollment milestone. Its code is unique within a tenant. */
export class WeightedEnrollmentMilestone {
  code: string;
  name: string;
  title: string;
  notes: string;
  timezone: string;
  description: string;
  phone: string;
  sendAt: number;
  status: WeightedEnrollmentMilestoneStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    notes: string,
    timezone: string,
    description: string,
    phone: string,
    sendAt: number,
    status: WeightedEnrollmentMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.notes = notes;
    this.timezone = timezone;
    this.description = description;
    this.phone = phone;
    this.sendAt = sendAt;
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

  canMoveTo(next: WeightedEnrollmentMilestoneStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
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

  moveTo(next: WeightedEnrollmentMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted enrollment milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): WeightedEnrollmentMilestone {
    return new WeightedEnrollmentMilestone(
      this.code,
      this.name,
      this.title,
      this.notes,
      this.timezone,
      this.description,
      this.phone,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted enrollment milestone in status new. */
export function newWeightedEnrollmentMilestone(code: string, name: string): WeightedEnrollmentMilestone {
  return new WeightedEnrollmentMilestone(code, name, "", "", "", "", "", 0, "new");
}
