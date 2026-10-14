import * as text from "../../../../kit/text.js";

/** Where a funnel bundle is in its life cycle. */
export type FunnelBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A funnel bundle. Its code is unique within a tenant. */
export class FunnelBundle {
  code: string;
  label: string;
  budget: number;
  title: string;
  weight: number;
  locale: string;
  reviewer: string;
  status: FunnelBundleStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    title: string,
    weight: number,
    locale: string,
    reviewer: string,
    status: FunnelBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.title = title;
    this.weight = weight;
    this.locale = locale;
    this.reviewer = reviewer;
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

  canMoveTo(next: FunnelBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FunnelBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"funnel bundle"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.weight + this.budget) * 100) / 100;
  }

  copy(): FunnelBundle {
    return new FunnelBundle(
      this.code,
      this.label,
      this.budget,
      this.title,
      this.weight,
      this.locale,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a funnel bundle in status draft. */
export function newFunnelBundle(code: string, label: string): FunnelBundle {
  return new FunnelBundle(code, label, 0, "", 0, "", "", "draft");
}
