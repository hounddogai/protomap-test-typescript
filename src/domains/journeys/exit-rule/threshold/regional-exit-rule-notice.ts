import * as text from "../../../../kit/text.js";

/** Where a regional exit rule notice is in its life cycle. */
export type RegionalExitRuleNoticeStatus = "new" | "queued" | "running" | "done" | "failed";

/** A regional exit rule notice. Its code is unique within a tenant. */
export class RegionalExitRuleNotice {
  code: string;
  title: string;
  endsAt: number;
  summary: string;
  locale: string;
  quantity: number;
  unit: string;
  description: string;
  createdAt: number;
  segment: string;
  status: RegionalExitRuleNoticeStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    summary: string,
    locale: string,
    quantity: number,
    unit: string,
    description: string,
    createdAt: number,
    segment: string,
    status: RegionalExitRuleNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.summary = summary;
    this.locale = locale;
    this.quantity = quantity;
    this.unit = unit;
    this.description = description;
    this.createdAt = createdAt;
    this.segment = segment;
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

  canMoveTo(next: RegionalExitRuleNoticeStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
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

  moveTo(next: RegionalExitRuleNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional exit rule notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedVolume(): number {
    return Math.round((this.quantity - this.endsAt) * 100) / 100;
  }

  copy(): RegionalExitRuleNotice {
    return new RegionalExitRuleNotice(
      this.code,
      this.title,
      this.endsAt,
      this.summary,
      this.locale,
      this.quantity,
      this.unit,
      this.description,
      this.createdAt,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional exit rule notice in status new. */
export function newRegionalExitRuleNotice(code: string, title: string): RegionalExitRuleNotice {
  return new RegionalExitRuleNotice(code, title, 0, "", "", 0, "", "", 0, "", "new");
}
