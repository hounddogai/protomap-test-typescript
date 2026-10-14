import * as text from "../../../../kit/text.js";

/** Where a insight group is in its life cycle. */
export type InsightGroupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A insight group. Its code is unique within a tenant. */
export class InsightGroup {
  code: string;
  title: string;
  budget: number;
  quantity: number;
  reviewer: string;
  frequencyCap: number;
  category: string;
  locale: string;
  ownerId: string;
  campaignRef: string;
  channel: string;
  status: InsightGroupStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    quantity: number,
    reviewer: string,
    frequencyCap: number,
    category: string,
    locale: string,
    ownerId: string,
    campaignRef: string,
    channel: string,
    status: InsightGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.quantity = quantity;
    this.reviewer = reviewer;
    this.frequencyCap = frequencyCap;
    this.category = category;
    this.locale = locale;
    this.ownerId = ownerId;
    this.campaignRef = campaignRef;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: InsightGroupStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netLoad(): number {
    return Math.round(this.budget * this.frequencyCap * 100) / 100;
  }

  copy(): InsightGroup {
    return new InsightGroup(
      this.code,
      this.title,
      this.budget,
      this.quantity,
      this.reviewer,
      this.frequencyCap,
      this.category,
      this.locale,
      this.ownerId,
      this.campaignRef,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a insight group in status draft. */
export function newInsightGroup(code: string, title: string): InsightGroup {
  return new InsightGroup(code, title, 0, 0, "", 0, "", "", "", "", "", "draft");
}
