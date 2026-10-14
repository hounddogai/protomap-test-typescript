import * as text from "../../../../kit/text.js";

/** Where a complaint group is in its life cycle. */
export type ComplaintGroupStatus = "new" | "queued" | "running" | "done" | "failed";

/** One complaint group, with what the planners need to act on it. */
export class ComplaintGroup {
  code: string;
  name: string;
  durationMinutes: number;
  variant: string;
  conversionRate: number;
  visible: boolean;
  reviewer: string;
  rate: number;
  locale: string;
  journeyId: string;
  version: number;
  status: ComplaintGroupStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    variant: string,
    conversionRate: number,
    visible: boolean,
    reviewer: string,
    rate: number,
    locale: string,
    journeyId: string,
    version: number,
    status: ComplaintGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.variant = variant;
    this.conversionRate = conversionRate;
    this.visible = visible;
    this.reviewer = reviewer;
    this.rate = rate;
    this.locale = locale;
    this.journeyId = journeyId;
    this.version = version;
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

  canMoveTo(next: ComplaintGroupStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ComplaintGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round((this.durationMinutes - this.rate) * 100) / 100;
  }

  copy(): ComplaintGroup {
    return new ComplaintGroup(
      this.code,
      this.name,
      this.durationMinutes,
      this.variant,
      this.conversionRate,
      this.visible,
      this.reviewer,
      this.rate,
      this.locale,
      this.journeyId,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a complaint group in status new. */
export function newComplaintGroup(code: string, name: string): ComplaintGroup {
  return new ComplaintGroup(code, name, 0, "", 0, false, "", 0, "", "", 0, "new");
}
