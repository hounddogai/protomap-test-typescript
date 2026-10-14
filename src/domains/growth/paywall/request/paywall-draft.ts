import * as text from "../../../../kit/text.js";

/** Where a paywall draft is in its life cycle. */
export type PaywallDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a paywall draft and its current status. */
export class PaywallDraft {
  code: string;
  name: string;
  description: string;
  label: string;
  openRate: number;
  score: number;
  maximum: number;
  updatedAt: number;
  status: PaywallDraftStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    label: string,
    openRate: number,
    score: number,
    maximum: number,
    updatedAt: number,
    status: PaywallDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.label = label;
    this.openRate = openRate;
    this.score = score;
    this.maximum = maximum;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PaywallDraftStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PaywallDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedValue(): number {
    return Math.round((this.openRate - this.score) * 100) / 100;
  }

  copy(): PaywallDraft {
    return new PaywallDraft(
      this.code,
      this.name,
      this.description,
      this.label,
      this.openRate,
      this.score,
      this.maximum,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a paywall draft in status open. */
export function newPaywallDraft(code: string, name: string): PaywallDraft {
  return new PaywallDraft(code, name, "", "", 0, 0, 0, 0, "open");
}
