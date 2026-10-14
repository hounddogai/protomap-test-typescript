import * as text from "../../../../kit/text.js";

/** Where a adaptive complaint group is in its life cycle. */
export type AdaptiveComplaintGroupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A adaptive complaint group as the complaint team keeps it. */
export class AdaptiveComplaintGroup {
  code: string;
  name: string;
  country: string;
  maximum: number;
  startsAt: number;
  phone: string;
  campaignRef: string;
  status: AdaptiveComplaintGroupStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    maximum: number,
    startsAt: number,
    phone: string,
    campaignRef: string,
    status: AdaptiveComplaintGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.maximum = maximum;
    this.startsAt = startsAt;
    this.phone = phone;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: AdaptiveComplaintGroupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: AdaptiveComplaintGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive complaint group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"adaptive complaint group"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.maximum + this.startsAt) * 100) / 100;
  }

  copy(): AdaptiveComplaintGroup {
    return new AdaptiveComplaintGroup(
      this.code,
      this.name,
      this.country,
      this.maximum,
      this.startsAt,
      this.phone,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a adaptive complaint group in status planned. */
export function newAdaptiveComplaintGroup(code: string, name: string): AdaptiveComplaintGroup {
  return new AdaptiveComplaintGroup(code, name, "", 0, 0, "", "", "planned");
}
