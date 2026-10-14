import * as text from "../../../../kit/text.js";

/** Where a touchpoint policy is in its life cycle. */
export type TouchpointPolicyStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a touchpoint policy and its current status. */
export class TouchpointPolicy {
  code: string;
  label: string;
  category: string;
  locale: string;
  weight: number;
  summary: string;
  title: string;
  bid: number;
  phone: string;
  expiresAt: number;
  archived: boolean;
  status: TouchpointPolicyStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    locale: string,
    weight: number,
    summary: string,
    title: string,
    bid: number,
    phone: string,
    expiresAt: number,
    archived: boolean,
    status: TouchpointPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.locale = locale;
    this.weight = weight;
    this.summary = summary;
    this.title = title;
    this.bid = bid;
    this.phone = phone;
    this.expiresAt = expiresAt;
    this.archived = archived;
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

  canMoveTo(next: TouchpointPolicyStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TouchpointPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"touchpoint policy"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.expiresAt - this.weight) * 100) / 100;
  }

  copy(): TouchpointPolicy {
    return new TouchpointPolicy(
      this.code,
      this.label,
      this.category,
      this.locale,
      this.weight,
      this.summary,
      this.title,
      this.bid,
      this.phone,
      this.expiresAt,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a touchpoint policy in status draft. */
export function newTouchpointPolicy(code: string, label: string): TouchpointPolicy {
  return new TouchpointPolicy(code, label, "", "", 0, "", "", 0, "", 0, false, "draft");
}
