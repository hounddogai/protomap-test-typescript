import * as text from "../../../../kit/text.js";

/** Where a lenient model notice is in its life cycle. */
export type LenientModelNoticeStatus = "created" | "validated" | "published" | "retired";

/** A lenient model notice as the model team keeps it. */
export class LenientModelNotice {
  code: string;
  title: string;
  country: string;
  threshold: number;
  cost: number;
  label: string;
  locale: string;
  unit: string;
  notes: string;
  channel: string;
  status: LenientModelNoticeStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    threshold: number,
    cost: number,
    label: string,
    locale: string,
    unit: string,
    notes: string,
    channel: string,
    status: LenientModelNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.threshold = threshold;
    this.cost = cost;
    this.label = label;
    this.locale = locale;
    this.unit = unit;
    this.notes = notes;
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

  canMoveTo(next: LenientModelNoticeStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
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
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LenientModelNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient model notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient model notice"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.threshold + this.cost) * 100) / 100;
  }

  copy(): LenientModelNotice {
    return new LenientModelNotice(
      this.code,
      this.title,
      this.country,
      this.threshold,
      this.cost,
      this.label,
      this.locale,
      this.unit,
      this.notes,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a lenient model notice in status created. */
export function newLenientModelNotice(code: string, title: string): LenientModelNotice {
  return new LenientModelNotice(code, title, "", 0, 0, "", "", "", "", "", "created");
}
