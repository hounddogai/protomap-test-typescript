import * as text from "../../../../kit/text.js";

/** Where a mention budget is in its life cycle. */
export type MentionBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** A mention budget as the mention team keeps it. */
export class MentionBudget {
  code: string;
  label: string;
  quantity: number;
  locale: string;
  summary: string;
  timezone: string;
  title: string;
  status: MentionBudgetStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    locale: string,
    summary: string,
    timezone: string,
    title: string,
    status: MentionBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.locale = locale;
    this.summary = summary;
    this.timezone = timezone;
    this.title = title;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: MentionBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: MentionBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): MentionBudget {
    return new MentionBudget(
      this.code,
      this.label,
      this.quantity,
      this.locale,
      this.summary,
      this.timezone,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a mention budget in status requested. */
export function newMentionBudget(code: string, label: string): MentionBudget {
  return new MentionBudget(code, label, 0, "", "", "", "", "requested");
}
