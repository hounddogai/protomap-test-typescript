import * as text from "../../../../kit/text.js";

/** Where a weighted reward template is in its life cycle. */
export type WeightedRewardTemplateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted reward template. Its code is unique within a tenant. */
export class WeightedRewardTemplate {
  code: string;
  label: string;
  endsAt: number;
  contactEmail: string;
  pinned: boolean;
  status: WeightedRewardTemplateStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    contactEmail: string,
    pinned: boolean,
    status: WeightedRewardTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.contactEmail = contactEmail;
    this.pinned = pinned;
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

  canMoveTo(next: WeightedRewardTemplateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WeightedRewardTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reward template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): WeightedRewardTemplate {
    return new WeightedRewardTemplate(this.code, this.label, this.endsAt, this.contactEmail, this.pinned, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted reward template in status planned. */
export function newWeightedRewardTemplate(code: string, label: string): WeightedRewardTemplate {
  return new WeightedRewardTemplate(code, label, 0, "", false, "planned");
}
